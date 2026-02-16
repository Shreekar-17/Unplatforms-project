import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { $convertFromMarkdownString, $convertToMarkdownString } from '@lexical/markdown';
import { $getRoot, $createParagraphNode, EditorState, FORMAT_TEXT_COMMAND, TextFormatType, $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Code } from 'lucide-react';

const EDITOR_NODES = [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
];

function Placeholder() {
    return (
        <div className="absolute top-[1.2rem] left-[1.125rem] text-gray-500 pointer-events-none select-none text-sm">
            Enter some text...
        </div>
    );
}

function ToolbarPlugin() {
    const [editor] = useLexicalComposerContext();

    const formatText = (format: TextFormatType) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    const formatHeading = (tag: 'h1' | 'h2') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(tag));
            }
        });
    };

    const formatList = (type: 'ul' | 'ol') => {
        if (type === 'ul') {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        } else {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }
    };

    const formatQuote = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
    };

    return (
        <div className="flex items-center gap-1 p-2 border-b border-board-border bg-board-card/30">
            <button onClick={() => formatText('bold')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Bold"><Bold size={14} /></button>
            <button onClick={() => formatText('italic')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Italic"><Italic size={14} /></button>
            <button onClick={() => formatText('code')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Code"><Code size={14} /></button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={() => formatHeading('h1')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Heading 1"><Heading1 size={14} /></button>
            <button onClick={() => formatHeading('h2')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Heading 2"><Heading2 size={14} /></button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={() => formatList('ul')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Bullet List"><List size={14} /></button>
            <button onClick={() => formatList('ol')} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Ordered List"><ListOrdered size={14} /></button>
            <button onClick={() => formatQuote()} className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition" title="Quote"><Quote size={14} /></button>
        </div>
    )
}

function UpdatePlugin({ markdown }: { markdown: string }) {
    const [editor] = useLexicalComposerContext();
    useEffect(() => {
        editor.update(() => {
            // Only update if empty or completely changed? 
            // Syncing markdown -> editor state is tricky if editing is active.
            // Usually we only init.
            const current = $convertToMarkdownString(TRANSFORMERS);
            if (current !== markdown && !markdown) {
                // clear?
                const root = $getRoot();
                root.clear();
            } else if (current === '' && markdown) {
                $convertFromMarkdownString(markdown, TRANSFORMERS);
            }
        });
    }, [editor, markdown]); // Only on mount/change if needed. 
    // Actually, strictly initializing is safer.
    return null;
}

export function RichTextEditor({ value, onChange, placeholder = "Description...", readOnly = false, className }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    className?: string;
}) {
    const initialConfig = {
        namespace: 'MyEditor',
        theme: {
            paragraph: 'mb-2 text-sm text-gray-300',
            quote: 'border-l-4 border-gray-600 pl-4 italic text-gray-400 my-2',
            heading: {
                h1: 'text-2xl font-bold text-gray-100 mb-3 mt-4',
                h2: 'text-xl font-bold text-gray-100 mb-2 mt-3',
            },
            list: {
                ul: 'list-disc list-inside mb-2 ml-2',
                ol: 'list-decimal list-inside mb-2 ml-2',
            },
            text: {
                bold: 'font-bold text-gray-100',
                italic: 'italic',
                code: 'bg-gray-800 rounded px-1 py-0.5 font-mono text-sm text-amber-300',
            },
            code: 'bg-gray-900 block p-3 rounded-lg font-mono text-sm overflow-x-auto my-3 text-gray-300',
        },
        onError: (e: Error) => console.error(e),
        nodes: EDITOR_NODES,
        editorState: (editor: any) => {
            editor.update(() => {
                if (value) {
                    $convertFromMarkdownString(value, TRANSFORMERS);
                } else {
                    const root = $getRoot();
                    if (root.isEmpty()) {
                        const paragraph = $createParagraphNode();
                        root.append(paragraph);
                    }
                }
            })
        },
        editable: !readOnly,
    };

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div className={clsx("relative flex flex-col w-full border rounded-lg bg-board-surface overflow-hidden transition-colors",
                readOnly ? "border-transparent bg-transparent" : "border-board-border focus-within:ring-1 focus-within:ring-indigo-500/50 hover:border-board-border/80",
                className
            )}>
                {!readOnly && <ToolbarPlugin />}
                <div className="relative">
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className={clsx(
                                    "min-h-[150px] outline-none px-4 py-3 text-sm text-gray-200 resize-none max-w-full overflow-hidden",
                                    readOnly ? "px-0 py-0 min-h-0" : ""
                                )}
                            />
                        }
                        placeholder={!readOnly && !value ? <Placeholder /> : null}
                        ErrorBoundary={(props) => <div className="text-red-500 text-sm p-2">Editor Error</div>}
                    />
                    <HistoryPlugin />
                    <ListPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <OnChangePlugin onChange={(editorState) => {
                        editorState.read(() => {
                            const markdown = $convertToMarkdownString(TRANSFORMERS);
                            onChange(markdown);
                        });
                    }} />
                </div>
            </div>
        </LexicalComposer>
    );
}
