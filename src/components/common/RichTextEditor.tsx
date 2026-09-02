"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import {
    Bold, Italic, Underline, Link as LinkIcon, Unlink,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
    Undo2, Redo2, Code,
    ChevronDown, Check
} from "lucide-react"

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    label?: string
    minHeight?: string
}

const COLORS = [
    { name: "Default", value: "#06153a" },
    { name: "Brand Blue", value: "#0b2e84" },
    { name: "Brand Red", value: "#f3122f" },
    { name: "Brand Gold", value: "#f4b400" },
    { name: "Green", value: "#16a34a" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Orange", value: "#ea580c" },
    { name: "Teal", value: "#0d9488" },
    { name: "Gray", value: "#6b7280" }
]

const isSameColor = (color1: string, color2: string) => {
    if (!color1 || !color2) return false
    if (color1.toLowerCase() === color2.toLowerCase()) return true

    const rgbMatch = color1.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i)
    if (rgbMatch) {
        const hex = "#" + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
            .map(x => {
                const hexVal = parseInt(x).toString(16)
                return hexVal.length === 1 ? "0" + hexVal : hexVal
            })
            .join("")
        return hex.toLowerCase() === color2.toLowerCase()
    }
    return false
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = "Start writing here...",
    label,
    minHeight = "200px"
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const [isHtmlMode, setIsHtmlMode] = useState(false)
    const [htmlValue, setHtmlValue] = useState(value || "")
    const [savedRange, setSavedRange] = useState<Range | null>(null)
    const [showLinkDialog, setShowLinkDialog] = useState(false)
    const [linkUrl, setLinkUrl] = useState("")
    const [showColorDropdown, setShowColorDropdown] = useState(false)
    const [selectedColor, setSelectedColor] = useState("#06153a")
    const [wordCount, setWordCount] = useState(0)
    const [charCount, setCharCount] = useState(0)

    // CUSTOM UNDO / REDO HISTORY STACKS
    const historyRef = useRef<string[]>([value || ""])
    const currentIndexRef = useRef(0)
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

    const [activeStyles, setActiveStyles] = useState({
        bold: false,
        italic: false,
        underline: false,
        link: false,
        heading: "<p>",
        color: "#06153a",
        alignLeft: false,
        alignCenter: false,
        alignRight: false,
        bulletList: false,
        orderedList: false,
    })

    // Helper to push to custom history stack
    const pushHistory = useCallback((val: string) => {
        if (val === historyRef.current[currentIndexRef.current]) return

        const nextHistory = historyRef.current.slice(0, currentIndexRef.current + 1)
        nextHistory.push(val)

        if (nextHistory.length > 100) {
            nextHistory.shift()
        }

        historyRef.current = nextHistory
        currentIndexRef.current = nextHistory.length - 1
    }, [])

    // Sync external changes
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || ""
            historyRef.current = [value || ""]
            currentIndexRef.current = 0
        }
        setHtmlValue(value || "")
        updateCounts(value || "")
    }, [value])

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
        }
    }, [])

    // Track active styling commands at current cursor selection
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection()
            if (!selection || selection.rangeCount === 0 || !editorRef.current) return

            const range = selection.getRangeAt(0)
            const isInsideEditor = editorRef.current.contains(range.commonAncestorContainer)

            if (isInsideEditor && !isHtmlMode) {
                const headingVal = document.queryCommandValue("formatBlock") || "p"
                const normalizedHeading = typeof headingVal === "string" ? headingVal.toLowerCase() : "p"
                const colorVal = document.queryCommandValue("foreColor") || "#06153a"

                // Detect if cursor is inside an anchor link node
                let isLink = false
                let node: Node | null = range.commonAncestorContainer
                while (node && node !== editorRef.current) {
                    if (node.nodeName === "A") {
                        isLink = true
                        break
                    }
                    node = node.parentNode
                }

                setActiveStyles({
                    bold: document.queryCommandState("bold"),
                    italic: document.queryCommandState("italic"),
                    underline: document.queryCommandState("underline"),
                    link: isLink,
                    heading: ["h1", "h2", "h3"].includes(normalizedHeading) ? `<${normalizedHeading}>` : "<p>",
                    color: colorVal,
                    alignLeft: document.queryCommandState("justifyLeft"),
                    alignCenter: document.queryCommandState("justifyCenter"),
                    alignRight: document.queryCommandState("justifyRight"),
                    bulletList: document.queryCommandState("insertUnorderedList"),
                    orderedList: document.queryCommandState("insertOrderedList"),
                })

                // Keep the top color indicator synced
                setSelectedColor(colorVal)
            }
        }

        document.addEventListener("selectionchange", handleSelectionChange)
        return () => {
            document.removeEventListener("selectionchange", handleSelectionChange)
        }
    }, [isHtmlMode])

    const updateCounts = (htmlString: string) => {
        // Strip tags to get clean text for counts
        const text = htmlString.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
        setCharCount(text.length)
        setWordCount(text ? text.split(/\s+/).length : 0)
    }

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML
            // If it's just an empty element or break, treat as empty
            const cleanHtml = html === "<br>" || html === "<div><br></div>" ? "" : html
            onChange(cleanHtml)
            setHtmlValue(cleanHtml)
            updateCounts(cleanHtml)

            // Debounce history additions during active typing
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current)
            }
            debounceTimerRef.current = setTimeout(() => {
                pushHistory(cleanHtml)
            }, 600)
        }
    }, [onChange, pushHistory])

    const handleHtmlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        setHtmlValue(val)
        onChange(val)
        updateCounts(val)
        pushHistory(val)
    }

    // Save browser selection range for async operations (e.g. inserting link via modal)
    const saveSelection = () => {
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            setSavedRange(selection.getRangeAt(0))
        }
    }

    const restoreSelection = () => {
        if (savedRange) {
            const selection = window.getSelection()
            if (selection) {
                selection.removeAllRanges()
                selection.addRange(savedRange)
            }
        }
    }

    const executeCommand = (command: string, value: string = "") => {
        if (isHtmlMode) return
        editorRef.current?.focus()
        document.execCommand(command, false, value)

        // Immediately record change to history stack on command executions
        if (editorRef.current) {
            const html = editorRef.current.innerHTML
            const cleanHtml = html === "<br>" || html === "<div><br></div>" ? "" : html
            pushHistory(cleanHtml)
            onChange(cleanHtml)
            setHtmlValue(cleanHtml)
            updateCounts(cleanHtml)
        }
    }

    const handleHeadingChange = (headingType: string) => {
        executeCommand("formatBlock", headingType)
    }

    const handleLinkClick = () => {
        saveSelection()
        setShowLinkDialog(true)
    }

    const insertLink = (e: React.FormEvent) => {
        e.preventDefault()
        restoreSelection()
        if (linkUrl.trim()) {
            let url = linkUrl.trim()
            if (!/^https?:\/\//i.test(url)) {
                url = "https://" + url
            }
            executeCommand("createLink", url)
        }
        setShowLinkDialog(false)
        setLinkUrl("")
    }

    const removeLink = () => {
        executeCommand("unlink")
    }

    const handleColorClick = (color: string) => {
        setSelectedColor(color)
        executeCommand("foreColor", color)
        setShowColorDropdown(false)
    }

    // LOCAL CUSTOM UNDO / REDO TRIGGERS
    const handleUndo = () => {
        if (currentIndexRef.current > 0) {
            currentIndexRef.current--
            const previousValue = historyRef.current[currentIndexRef.current]

            if (editorRef.current) {
                editorRef.current.innerHTML = previousValue
            }
            setHtmlValue(previousValue)
            onChange(previousValue)
            updateCounts(previousValue)
        }
    }

    const handleRedo = () => {
        if (currentIndexRef.current < historyRef.current.length - 1) {
            currentIndexRef.current++
            const nextValue = historyRef.current[currentIndexRef.current]

            if (editorRef.current) {
                editorRef.current.innerHTML = nextValue
            }
            setHtmlValue(nextValue)
            onChange(nextValue)
            updateCounts(nextValue)
        }
    }

    // Intercept keyboard commands (Ctrl+Z / Ctrl+Y) to enforce isolated local history
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.ctrlKey && e.key.toLowerCase() === "z") {
            e.preventDefault()
            if (e.shiftKey) {
                handleRedo()
            } else {
                handleUndo()
            }
        }
        if (e.ctrlKey && e.key.toLowerCase() === "y") {
            e.preventDefault()
            handleRedo()
        }
    }

    const getBtnClass = (isActive: boolean) =>
        `p-1.5 rounded-lg transition-all disabled:opacity-40 border ${isActive
            ? "bg-primary/10 text-primary border-primary/20"
            : "hover:bg-muted text-foreground/70 border-transparent"
        }`

    return (
        <div className="w-full flex flex-col space-y-2 select-none">
            {label && (
                <label className="text-xs font-semibold text-foreground/70 flex items-center gap-1 select-none">
                    {label}
                </label>
            )}

            {/* MAIN CARD CONTAINER */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">

                {/* TOOLBAR HEADER */}
                <div className="bg-muted/10 border-b border-border p-2 flex flex-wrap items-center gap-1">

                    {/* TEXT / HTML TOGGLE */}
                    <button
                        type="button"
                        onClick={() => setIsHtmlMode(!isHtmlMode)}
                        className={`p-1.5 rounded-lg hover:bg-muted text-foreground/70 transition-all ${isHtmlMode ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200" : ""
                            }`}
                        title="Toggle HTML Source Code"
                    >
                        <Code className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* HEADINGS DROPDOWN */}
                    <select
                        disabled={isHtmlMode}
                        onChange={(e) => handleHeadingChange(e.target.value)}
                        className="bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold px-2 py-1.5 rounded-lg border border-border focus:outline-none disabled:opacity-40"
                        aria-label="Heading level"
                        value={activeStyles.heading}
                    >
                        <option value="<p>">Paragraph</option>
                        <option value="<h1>">Heading 1</option>
                        <option value="<h2>">Heading 2</option>
                        <option value="<h3>">Heading 3</option>
                    </select>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* STYLE ACTIONS */}
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("bold")}
                        className={getBtnClass(activeStyles.bold)}
                        title="Bold"
                    >
                        <Bold className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("italic")}
                        className={getBtnClass(activeStyles.italic)}
                        title="Italic"
                    >
                        <Italic className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("underline")}
                        className={getBtnClass(activeStyles.underline)}
                        title="Underline"
                    >
                        <Underline className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* COLOR PICKER DROPDOWN */}
                    <div className="relative">
                        <button
                            type="button"
                            disabled={isHtmlMode}
                            onClick={() => setShowColorDropdown(!showColorDropdown)}
                            className="p-1.5 rounded-lg hover:bg-muted text-foreground/70 transition-all flex items-center gap-1 disabled:opacity-40"
                            title="Text Color"
                        >
                            <span
                                className="w-3.5 h-3.5 rounded-full border border-border"
                                style={{ backgroundColor: selectedColor }}
                            />
                            <ChevronDown className="w-3 h-3" />
                        </button>
                        {showColorDropdown && (
                            <div className="absolute right-0 mt-1 bg-card border border-border rounded-xl shadow-lg p-2.5 z-40 grid grid-cols-3 gap-2 w-36">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.name}
                                        type="button"
                                        onClick={() => handleColorClick(c.value)}
                                        className="w-8 h-8 rounded-full border border-border/80 hover:scale-110 active:scale-95 transition-all flex items-center justify-center relative group"
                                        style={{ backgroundColor: c.value }}
                                        title={c.name}
                                    >
                                        {isSameColor(selectedColor, c.value) && (
                                            <Check className="w-3 h-3 text-white drop-shadow-sm font-bold" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* ALIGNMENTS */}
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("justifyLeft")}
                        className={getBtnClass(activeStyles.alignLeft)}
                        title="Align Left"
                    >
                        <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("justifyCenter")}
                        className={getBtnClass(activeStyles.alignCenter)}
                        title="Align Center"
                    >
                        <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("justifyRight")}
                        className={getBtnClass(activeStyles.alignRight)}
                        title="Align Right"
                    >
                        <AlignRight className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* LISTS */}
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("insertUnorderedList")}
                        className={getBtnClass(activeStyles.bulletList)}
                        title="Bulleted List"
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={() => executeCommand("insertOrderedList")}
                        className={getBtnClass(activeStyles.orderedList)}
                        title="Numbered List"
                    >
                        <ListOrdered className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* LINKS */}
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={handleLinkClick}
                        className={getBtnClass(activeStyles.link)}
                        title="Insert Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode}
                        onClick={removeLink}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground/70 transition-all disabled:opacity-40"
                        title="Remove Link"
                    >
                        <Unlink className="w-4 h-4" />
                    </button>

                    <div className="w-[1px] h-5 bg-border mx-1" />

                    {/* UNDO / REDO */}
                    <button
                        type="button"
                        disabled={isHtmlMode || currentIndexRef.current <= 0}
                        onClick={handleUndo}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground/70 disabled:opacity-30 transition-all"
                        title="Undo"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        disabled={isHtmlMode || currentIndexRef.current >= historyRef.current.length - 1}
                        onClick={handleRedo}
                        className="p-1.5 rounded-lg hover:bg-muted text-foreground/70 disabled:opacity-30 transition-all"
                        title="Redo"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>

                {/* DYNAMIC EDIT AND PREVIEW BODY */}
                <div className={`relative bg-background text-foreground flex-1 min-h-[${minHeight}]`}>

                    {/* LINK DIALOG OVERLAY */}
                    {showLinkDialog && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                            <form onSubmit={insertLink} className="bg-card border border-border p-4 rounded-xl shadow-lg w-full max-w-sm space-y-3">
                                <div className="text-xs font-bold text-foreground/80 flex items-center gap-1">
                                    <LinkIcon className="w-3.5 h-3.5 text-primary" /> Insert Hyperlink URL
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter link (e.g., https://example.com)"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    className="w-full text-xs text-foreground bg-muted/20 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setShowLinkDialog(false)}
                                        className="px-3 py-1.5 rounded-lg hover:bg-muted text-foreground/60 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary/95 transition-all"
                                    >
                                        Insert Link
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* DUAL DIVISION GRID FOR SIDE-BY-SIDE LAYOUT */}
                    <div className="grid grid-cols-1 md:grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-border">

                        {/* LEFT COLUMN: THE EDITING BOARD */}
                        <div className="p-4 flex flex-col min-h-[inherit]">
                            {isHtmlMode ? (
                                <textarea
                                    value={htmlValue}
                                    onChange={handleHtmlChange}
                                    className="w-full flex-1 min-h-[220px] font-mono text-xs text-amber-900 bg-amber-50/20 border border-amber-200/50 rounded-xl p-3 focus:outline-none focus:border-amber-400 focus:bg-amber-50/10 resize-y"
                                    placeholder="&lt;p&gt;Write custom HTML here...&lt;/p&gt;"
                                />
                            ) : (
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    onInput={handleInput}
                                    onKeyDown={handleKeyDown}
                                    className="editor-editable w-full flex-1 min-h-[220px] text-sm text-foreground outline-none whitespace-pre-wrap select-text leading-relaxed overflow-y-auto relative"
                                    data-placeholder={placeholder}
                                    style={{ minHeight }}
                                />
                            )}
                        </div>

                        {/* RIGHT COLUMN: FRONTEND LIVE PREVIEW AREA */}
                        {/* <div className="p-4 bg-muted/5 min-h-[inherit] flex flex-col">
                            <div className="text-[10px] uppercase font-bold text-foreground/40 mb-2 tracking-wider flex items-center gap-1.5 select-none border-b border-border/40 pb-1.5">
                                <Eye className="w-3 h-3" /> Live Store Preview
                            </div>
                            <div
                                className="rich-text-preview flex-1 text-sm text-foreground break-words overflow-y-auto max-h-[350px] leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: htmlValue || `<p class="text-foreground/30 italic">${placeholder}</p>` }}
                            />
                        </div> */}
                    </div>
                </div>

                {/* BOTTOM FOOTER WITH COUNTERS */}
                <div className="bg-muted/10 border-t border-border px-3 py-1.5 flex items-center justify-between text-[10px] text-foreground/40 font-medium select-none">
                    <div className="flex items-center gap-3">
                        <span>Words: <strong className="text-foreground/60">{wordCount}</strong></span>
                        <span>Characters: <strong className="text-foreground/60">{charCount}</strong></span>
                    </div>
                    <div>
                        <span>Mode: <strong className="text-foreground/60 uppercase">{isHtmlMode ? "HTML Code" : "Visual Rich Text"}</strong></span>
                    </div>
                </div>

            </div>
        </div>
    )
}
