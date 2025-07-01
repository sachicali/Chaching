"use client";

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye,
  EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => (
    <div className="h-64 border rounded-md flex items-center justify-center bg-muted">
      <span className="text-muted-foreground">Loading editor...</span>
    </div>
  ),
});

// Import Quill styles
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: number;
  readOnly?: boolean;
  showWordCount?: boolean;
  onVariableInsert?: (variable: string) => void;
}

interface RichTextEditorRef {
  focus: () => void;
  blur: () => void;
  insertText: (text: string) => void;
  getWordCount: () => number;
}

// Email-safe Quill modules configuration
const getQuillModules = () => ({
  toolbar: {
    container: [
      // Text formatting
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      
      // Lists and alignment
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      
      // Links and quotes
      ['link', 'blockquote'],
      
      // Colors (limited for email compatibility)
      [{ 'color': ['#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff', '#ffffff', '#facccc', '#ffebcc', '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff', '#bbbbbb', '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', '#c285ff', '#888888', '#a10000', '#b26b00', '#b2b200', '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000', '#663d00', '#666600', '#003700', '#002966', '#3d1466'] }],
      
      // Clean up
      ['clean']
    ],
  },
  clipboard: {
    // Strip styles to maintain email compatibility
    matchVisual: false,
  }
});

// Email-safe formats (no dangerous HTML elements)
const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'align',
  'link', 'blockquote',
  'color',
];

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ 
    value, 
    onChange, 
    placeholder = "Start typing your email content...", 
    className,
    maxHeight = 400,
    readOnly = false,
    showWordCount = true,
    onVariableInsert,
  }, ref) => {
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [wordCount, setWordCount] = useState(0);

    // Calculate word count
    useEffect(() => {
      if (value) {
        // Remove HTML tags and count words
        const textContent = value.replace(/<[^>]*>/g, '').trim();
        const words = textContent ? textContent.split(/\s+/).length : 0;
        setWordCount(words);
      } else {
        setWordCount(0);
      }
    }, [value]);

    // Expose methods through ref (simplified for now)
    useImperativeHandle(ref, () => ({
      focus: () => {
        // Focus functionality will be handled by the parent component
        console.log('Focus called on RichTextEditor');
      },
      blur: () => {
        // Blur functionality will be handled by the parent component
        console.log('Blur called on RichTextEditor');
      },
      insertText: (text: string) => {
        // For now, append text to current content
        onChange(value + text);
      },
      getWordCount: () => wordCount,
    }));

    // Handle text changes
    const handleChange = (content: string) => {
      onChange(content);
    };

    // Custom styles for dark theme compatibility
    const editorStyles = {
      maxHeight: `${maxHeight}px`,
      overflow: 'auto',
    };

    if (isPreviewMode) {
      return (
        <Card className={cn("relative", className)}>
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Email Preview</h3>
            <div className="flex items-center gap-2">
              {showWordCount && (
                <Badge variant="secondary" className="text-xs">
                  {wordCount} words
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewMode(false)}
              >
                <EyeOff className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
          <div 
            className="p-4 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
            style={editorStyles}
          />
        </Card>
      );
    }

    return (
      <Card className={cn("relative", className)}>
        {/* Toolbar Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="text-sm font-medium">Email Content</h3>
          <div className="flex items-center gap-2">
            {showWordCount && (
              <Badge variant="secondary" className="text-xs">
                {wordCount} words
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsPreviewMode(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="relative">
          <ReactQuill
            theme="snow"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            readOnly={readOnly}
            modules={getQuillModules()}
            formats={quillFormats}
            style={editorStyles}
            className={cn(
              "border-0",
              "[&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:rounded-none",
              "[&_.ql-container]:border-0 [&_.ql-container]:rounded-none",
              "[&_.ql-editor]:min-h-[200px]",
              // Dark theme styles
              "dark:[&_.ql-toolbar]:bg-background dark:[&_.ql-toolbar]:border-border",
              "dark:[&_.ql-container]:bg-background",
              "dark:[&_.ql-editor]:text-foreground",
              "dark:[&_.ql-stroke]:stroke-foreground",
              "dark:[&_.ql-fill]:fill-foreground",
              "dark:[&_.ql-picker-label]:text-foreground",
              // Disabled state
              readOnly && "opacity-60 pointer-events-none"
            )}
          />
        </div>

        {/* Email Compatibility Notice */}
        <div className="px-3 py-2 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💡 This editor is optimized for email compatibility. Some formatting may appear differently in email clients.
          </p>
        </div>
      </Card>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;