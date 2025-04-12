// app/page.tsx
'use client';

import MarkdownEditor from '../components/MarkdownEditor';
import GraphView from '../components/GraphView';
import { useState, useEffect, useRef } from 'react';
import { extractWikiLinks } from '../lib/parseLinks';
import { FileText, GitBranch, Settings, Search, PanelLeftClose, PanelLeftOpen, Plus, Eye, GitBranch as GraphIcon, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Note {
  title: string;
  content: string;
  updatedAt: string;
}

interface Folder {
  name: string;
  notes: Note[];
  subfolders: Folder[];
  isOpen: boolean;
}

const initialFolders: Folder[] = [
  {
    name: 'my',
    notes: [],
    subfolders: [
      {
        name: 'ooore',
        notes: [],
        subfolders: [],
        isOpen: false,
      },
      {
        name: 'ext',
        notes: [],
        subfolders: [
          {
            name: 'abigél',
            notes: [
              { title: 'abidhamma-philosophy', content: '# Abidhamma Philosophy\n\nContent here...', updatedAt: new Date().toISOString() },
            ],
            subfolders: [],
            isOpen: true,
          },
          {
            name: 'alina',
            notes: [],
            subfolders: [
              {
                name: 'alina',
                notes: [],
                subfolders: [],
                isOpen: false,
              },
            ],
            isOpen: true,
          },
        ],
        isOpen: true,
      },
      {
        name: 'dlt',
        notes: [],
        subfolders: [
          {
            name: 'at',
            notes: [],
            subfolders: [],
            isOpen: false,
          },
        ],
        isOpen: false,
      },
    ],
    isOpen: true,
  },
];

// Preprocess [[links]] into standard Markdown links
const preprocessMarkdown = (content: string, notes: Note[]) => {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const targetNote = notes.find(n => n.title === linkText);
    return targetNote ? `[${linkText}](#${linkText})` : linkText;
  });
};

// Recursive function to collect all notes for link resolution
const collectAllNotes = (folders: Folder[]): Note[] => {
  let allNotes: Note[] = [];
  folders.forEach(folder => {
    allNotes = [...allNotes, ...folder.notes];
    if (folder.subfolders.length > 0) {
      allNotes = [...allNotes, ...collectAllNotes(folder.subfolders)];
    }
  });
  return allNotes;
};

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [currentNote, setCurrentNote] = useState(initialFolders[0].subfolders[1].subfolders[0].notes[0]?.title || 'abidhamma-philosophy');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50);
  const [isHydrated, setIsHydrated] = useState(false);
  const [rightPaneView, setRightPaneView] = useState<'graph' | 'markdown'>('graph');
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
      const allNotes = collectAllNotes(JSON.parse(savedFolders));
      setCurrentNote(allNotes[0]?.title || 'abidhamma-philosophy');
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem('folders', JSON.stringify(folders));
    }
  }, [folders, isHydrated]);

  const allNotes = collectAllNotes(folders);
  const currentNoteContent = allNotes.find(n => n.title === currentNote)?.content || '';
  const links = extractWikiLinks(currentNoteContent);
  const processedMarkdown = preprocessMarkdown(currentNoteContent, allNotes);

  const handleNoteChange = (value: string) => {
    const updateNoteInFolders = (folders: Folder[]): Folder[] => {
      return folders.map(folder => {
        if (folder.notes.some(note => note.title === currentNote)) {
          return {
            ...folder,
            notes: folder.notes.map(note =>
              note.title === currentNote
                ? { ...note, content: value, updatedAt: new Date().toISOString() }
                : note
            ),
          };
        }
        if (folder.subfolders.length > 0) {
          return { ...folder, subfolders: updateNoteInFolders(folder.subfolders) };
        }
        return folder;
      });
    };
    setFolders(updateNoteInFolders(folders));
  };

  const createNewNote = () => {
    const newNote = {
      title: `Note ${allNotes.length + 1}`,
      content: `# Note ${allNotes.length + 1}\n\nStart writing...`,
      updatedAt: new Date().toISOString(),
    };
    const updateFoldersWithNewNote = (folders: Folder[]): Folder[] => {
      return folders.map(folder => {
        if (folder.name === 'my') { // Add to root 'my' folder for simplicity
          return { ...folder, notes: [...folder.notes, newNote] };
        }
        if (folder.subfolders.length > 0) {
          return { ...folder, subfolders: updateFoldersWithNewNote(folder.subfolders) };
        }
        return folder;
      });
    };
    setFolders(updateFoldersWithNewNote(folders));
    setCurrentNote(newNote.title);
  };

  const toggleFolder = (folderPath: string[]) => {
    const updateFolderState = (folders: Folder[], path: string[]): Folder[] => {
      if (path.length === 0) return folders;
      return folders.map(folder => {
        if (folder.name === path[0]) {
          if (path.length === 1) {
            return { ...folder, isOpen: !folder.isOpen };
          }
          return { ...folder, subfolders: updateFolderState(folder.subfolders, path.slice(1)) };
        }
        return folder;
      });
    };
    setFolders(updateFolderState(folders, folderPath));
  };

  const filteredNotes = allNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    setEditorWidth(Math.max(20, Math.min(80, newWidth)));
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isHydrated) {
    return <div className="h-screen bg-gray-900" />;
  }

  const renderFolder = (folder: Folder, path: string[] = []) => {
    return (
      <div key={folder.name} className="ml-2">
        <div 
          className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
          onClick={() => toggleFolder([...path, folder.name])}
        >
          {folder.isOpen ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
          <span>{folder.name}</span>
        </div>
        {folder.isOpen && (
          <div className="ml-4">
            {folder.notes.map(note => (
              <div
                key={note.title}
                onClick={() => setCurrentNote(note.title)}
                className={`p-2 rounded cursor-pointer ${currentNote === note.title ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
              >
                <div className="font-medium">{note.title}</div>
                <div className="text-xs text-gray-400">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            {folder.subfolders.map(subfolder => renderFolder(subfolder, [...path, folder.name]))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-gray-900 text-gray-100">
      <header className="px-6 py-4 bg-gray-800 shadow-lg flex items-center justify-between">
        <div className="flex items-center">
          <button className="mr-4" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </button>
          <h1 className="text-xl font-semibold">Knowledge Base</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={createNewNote} className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded">
            <Plus size={16} className="mr-2" /> New Note
          </button>
          <button 
            onClick={() => setRightPaneView(rightPaneView === 'graph' ? 'markdown' : 'graph')}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded"
            title={rightPaneView === 'graph' ? 'Switch to Markdown View' : 'Switch to Graph View'}
          >
            {rightPaneView === 'graph' ? <Eye size={16} /> : <GraphIcon size={16} />}
          </button>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <nav className="flex flex-col items-center w-16 bg-gray-800 py-4 space-y-6 border-r border-gray-700">
          <button className="text-gray-400 hover:text-white"><FileText /></button>
          <button className="text-gray-400 hover:text-white"><GitBranch /></button>
          <button className="text-gray-400 hover:text-white"><Search /></button>
          <button className="text-gray-400 hover:text-white mt-auto"><Settings /></button>
        </nav>

        {isSidebarOpen && (
          <aside className="w-72 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
            <div className="flex-1 overflow-auto">
              {searchQuery ? (
                filteredNotes.map(note => (
                  <div
                    key={note.title}
                    onClick={() => setCurrentNote(note.title)}
                    className={`p-3 mb-2 rounded cursor-pointer ${currentNote === note.title ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                  >
                    <div className="font-medium">{note.title}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                folders.map(folder => renderFolder(folder))
              )}
            </div>
          </aside>
        )}

        <section className="flex flex-1" ref={containerRef}>
          <div style={{ width: `${editorWidth}%` }} className="h-full border-r border-gray-700 relative">
            <MarkdownEditor value={currentNoteContent} onChange={handleNoteChange} />
            <div
              onMouseDown={handleMouseDown}
              className="absolute right-0 top-0 w-2 h-full bg-gray-700 cursor-col-resize hover:bg-gray-600"
            />
          </div>
          <div style={{ width: `${100 - editorWidth}%` }} className="h-full">
            {rightPaneView === 'graph' ? (
              <GraphView centerLabel={currentNote} links={links} />
            ) : (
              <div className="h-full bg-gray-800 p-6 overflow-auto prose prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        className="text-blue-400 hover:underline" 
                        onClick={(e) => {
                          e.preventDefault();
                          const noteTitle = children?.toString();
                          if (allNotes.some(n => n.title === noteTitle)) {
                            setCurrentNote(noteTitle);
                          }
                        }}
                      >
                        {children}
                      </a>
                    ),
                    code: ({ inline, className, children, ...props }) => {
                      return inline ? (
                        <code className="bg-gray-700 px-1 rounded text-sm" {...props}>{children}</code>
                      ) : (
                        <pre className="bg-gray-700 p-2 rounded my-2 text-sm">
                          <code {...props}>{children}</code>
                        </pre>
                      );
                    },
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-2">{children}</h2>,
                    ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                    table: ({ children }) => <table className="border-collapse border border-gray-600 my-2">{children}</table>,
                    th: ({ children }) => <th className="border border-gray-600 p-2 bg-gray-700">{children}</th>,
                    td: ({ children }) => <td className="border border-gray-600 p-2">{children}</td>
                  }}
                >
                  {processedMarkdown}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}