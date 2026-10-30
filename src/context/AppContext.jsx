import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Sample initial documents with rich, realistic content
const INITIAL_DOCUMENTS = [
  {
    id: 'doc-1',
    name: 'Operating Systems - Virtual Memory & Paging.pdf',
    type: 'PDF',
    size: '3.4 MB',
    wordCount: 8420,
    uploadDate: '2026-10-24',
    status: 'Processed',
    topic: 'Computer Science',
    excerpt: 'Virtual memory is a memory management capability of an OS that uses hardware and software to allow a computer to compensate for physical memory shortages, by temporarily transferring data from random access memory (RAM) to disk storage. Paging is a memory management scheme by which a computer stores and retrieves data from secondary storage for use in main memory.',
    keyPoints: [
      'Paging eliminates the need for contiguous allocation of physical memory',
      'Page fault occurs when a referenced page is not present in physical RAM',
      'Translation Lookaside Buffer (TLB) speeds up virtual-to-physical address translation',
      'Thrashing happens when the OS spends more time paging than executing processes'
    ]
  },
  {
    id: 'doc-2',
    name: 'Machine Learning - Gradient Descent & Optimization.pdf',
    type: 'PDF',
    size: '4.8 MB',
    wordCount: 11250,
    uploadDate: '2026-10-26',
    status: 'Processed',
    topic: 'Artificial Intelligence',
    excerpt: 'Gradient descent is a first-order iterative optimization algorithm for finding a local minimum of a differentiable function. In machine learning, it is used to minimize the cost function by iteratively adjusting model parameters in the direction of steepest descent, proportional to the negative of the gradient.',
    keyPoints: [
      'Batch Gradient Descent uses the entire training dataset per update step',
      'Stochastic Gradient Descent (SGD) updates parameters using a single random sample per step',
      'Mini-batch Gradient Descent balances convergence speed and computational efficiency',
      'Learning rate (alpha) determines the step size; too large causes divergence, too small slows convergence'
    ]
  },
  {
    id: 'doc-3',
    name: 'Database Systems - Normalization & ACID Properties.docx',
    type: 'DOCX',
    size: '1.9 MB',
    wordCount: 5640,
    uploadDate: '2026-10-27',
    status: 'Processed',
    topic: 'Databases',
    excerpt: 'Database normalization is the process of structuring a relational database in accordance with a series of normal forms to reduce data redundancy and improve data integrity. ACID properties (Atomicity, Consistency, Isolation, Durability) guarantee that database transactions are processed reliably.',
    keyPoints: [
      '1NF requires atomic values and unique records',
      '2NF eliminates partial functional dependencies on candidate keys',
      '3NF eliminates transitive dependencies',
      'BCNF is a stricter version of 3NF where every determinant must be a candidate key',
      'ACID guarantees transactional integrity in distributed and relational databases'
    ]
  }
];

const INITIAL_NOTES = [
  {
    id: 'note-1',
    title: 'TLB Miss Handling & Page Fault Steps',
    subject: 'Operating Systems',
    tags: ['Exam Prep', 'Memory', 'OS'],
    content: '1. CPU sends virtual address.\n2. TLB is checked. If TLB hit, physical frame is retrieved in ~1ns.\n3. If TLB miss, page table is accessed in RAM.\n4. If valid bit is 0, OS raises a page fault interrupt.\n5. Trap handler reads page from swap disk, loads into free frame, updates page table, restarts the faulting instruction.',
    updatedAt: 'Yesterday, 4:15 PM',
    docId: 'doc-1'
  },
  {
    id: 'note-2',
    title: 'SGD with Momentum Formula & Concept',
    subject: 'Machine Learning',
    tags: ['Optimization', 'Deep Learning'],
    content: 'Velocity update: v_t = gamma * v_{t-1} + eta * grad(theta).\nParameter update: theta = theta - v_t.\nMomentum helps damp oscillations in directions with high curvature and accelerates movement along flatter ravines.',
    updatedAt: '2 days ago',
    docId: 'doc-2'
  },
  {
    id: 'note-3',
    title: 'Quick BCNF Decomposition Checklist',
    subject: 'Database Systems',
    tags: ['Formulas', 'DBMS'],
    content: 'For every functional dependency X -> Y:\n1. Is Y a subset of X (trivial)? If yes, OK.\n2. Is X a superkey? If yes, OK.\n3. If not, decompose R into R1(X U Y) and R2(R - (Y - X)).\nVerify lossless-join and dependency preservation.',
    updatedAt: '3 days ago',
    docId: 'doc-3'
  }
];

const INITIAL_TASKS = [
  {
    id: 'task-1',
    title: 'Review Virtual Memory & Paging lecture notes',
    subject: 'Operating Systems',
    priority: 'High',
    dueDate: '2026-10-29',
    completed: false,
    estimatedMinutes: 45
  },
  {
    id: 'task-2',
    title: 'Solve 10 Practice Questions on Gradient Descent',
    subject: 'Machine Learning',
    priority: 'High',
    dueDate: '2026-10-30',
    completed: false,
    estimatedMinutes: 30
  },
  {
    id: 'task-3',
    title: 'Complete BCNF decomposition worksheet',
    subject: 'Database Systems',
    priority: 'Medium',
    dueDate: '2026-11-01',
    completed: true,
    estimatedMinutes: 60
  },
  {
    id: 'task-4',
    title: 'Prepare Midterm flashcards for Computer Networks',
    subject: 'Computer Networks',
    priority: 'Low',
    dueDate: '2026-11-03',
    completed: false,
    estimatedMinutes: 40
  }
];

export function AppProvider({ children }) {
  // Navigation State
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // App Data with localStorage persistence
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('studymate_docs');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('studymate_notes');
    return saved ? JSON.parse(saved) : INITIAL_NOTES;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('studymate_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('studymate_stats');
    return saved ? JSON.parse(saved) : {
      quizzesCompleted: 14,
      avgQuizScore: 88,
      studyStreakDays: 6,
      weeklyHours: 12.5,
      totalQuestionsAnswered: 74,
      retentionRate: 92
    };
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('studymate_settings');
    const savedSettings = saved ? JSON.parse(saved) : {};
    delete savedSettings.apiKey;
    delete savedSettings.geminiApiKey;
    delete savedSettings.openrouterApiKey;
    return {
      userName: 'Alex Chen',
      userMajor: 'B.Tech Computer Science',
      targetExamDate: '2026-11-15',
      responseStyle: 'Academic & Structured',
      dailyGoalMinutes: 60,
      ...savedSettings
    };
  });

  // Action context pass-through (e.g. from Documents to Chat or Summarizer)
  const [selectedDocId, setSelectedDocId] = useState('doc-1');
  const [toasts, setToasts] = useState([]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('studymate_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('studymate_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('studymate_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('studymate_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('studymate_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast Notification helper
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Actions
  const addDocument = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
    showToast(`"${newDoc.name}" uploaded and indexed successfully!`, 'success');
  };

  const removeDocument = (id) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    showToast(`Removed "${doc?.name || 'Document'}"`, 'info');
  };

  const addNote = (newNote) => {
    setNotes((prev) => [newNote, ...prev]);
    showToast(`Note "${newNote.title}" saved!`, 'success');
  };

  const updateNote = (id, updatedFields) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updatedFields, updatedAt: 'Just now' } : n))
    );
    showToast('Note updated successfully!', 'success');
  };

  const removeNote = (id) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Note deleted', 'info');
  };

  const toggleTask = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    showToast('Study task added to Revision Planner', 'success');
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showToast('Task removed', 'info');
  };

  const recordQuizResult = (score, total) => {
    const percentage = Math.round((score / total) * 100);
    setStats((prev) => {
      const newCompleted = prev.quizzesCompleted + 1;
      const newAvg = Math.round((prev.avgQuizScore * prev.quizzesCompleted + percentage) / newCompleted);
      return {
        ...prev,
        quizzesCompleted: newCompleted,
        avgQuizScore: newAvg,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + total
      };
    });
  };

  const navigateTo = (page, docId = null) => {
    setActivePage(page);
    if (docId) setSelectedDocId(docId);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        navigateTo,
        isSidebarOpen,
        setIsSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        documents,
        addDocument,
        removeDocument,
        notes,
        addNote,
        updateNote,
        removeNote,
        tasks,
        toggleTask,
        addTask,
        removeTask,
        stats,
        setStats,
        recordQuizResult,
        settings,
        setSettings,
        selectedDocId,
        setSelectedDocId,
        showToast,
        toasts,
        removeToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
