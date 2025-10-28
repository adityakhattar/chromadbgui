import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DefaultLayout from '@/layout/DefaultLayout';
import { API_BASE } from '@/utils/constants';
import { toast } from '@/utils/toast';

interface Document {
  id: string;
  text?: string;
  metadata?: any;
}

const DOCS_PER_PAGE = 25;

export default function CollectionDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [editDocText, setEditDocText] = useState('');
  const [editDocMetadata, setEditDocMetadata] = useState<Array<{key: string, value: string}>>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [newDocId, setNewDocId] = useState('');
  const [newDocText, setNewDocText] = useState('');
  const [newDocMetadata, setNewDocMetadata] = useState<Array<{key: string, value: string}>>([]);
  // URL fetching states
  const [inputMode, setInputMode] = useState<'manual' | 'url'>('manual');
  const [fetchUrl, setFetchUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [authType, setAuthType] = useState<'bearer' | 'api-key' | 'custom'>('bearer');
  const [showAuth, setShowAuth] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  // Chunking states
  const [enableChunking, setEnableChunking] = useState(false);
  const [chunkingMode, setChunkingMode] = useState<'semantic' | 'configurable'>('configurable');
  const [chunkSize, setChunkSize] = useState(500);
  const [chunkOverlap, setChunkOverlap] = useState(50);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filterByParentDoc, setFilterByParentDoc] = useState<string | null>(null);
  const [queryTopK, setQueryTopK] = useState(10);
  const [queryMetadata, setQueryMetadata] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [searchMode, setSearchMode] = useState<'filter' | 'query'>('filter');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<string>('');
  const [importProgressPercent, setImportProgressPercent] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'none' | 'date' | 'size'>('none');

  useEffect(() => {
    if (name) {
      fetchDocuments();
    }
  }, [name]);

  useEffect(() => {
    // Handle ESC key to close modals (except import modal when importing)
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedDocument(null);
        setShowCreateModal(false);
        setShowDeleteModal(false);
        setShowEditModal(false);
        setDeleteConfirmText('');  // Clear delete confirmation
        // Only close import modal if not currently importing
        if (!importLoading) {
          setShowImportModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [importLoading]);

  useEffect(() => {
    // Filter documents based on search query
    let result = documents;

    // Filter by parent document ID if set
    if (filterByParentDoc) {
      result = documents.filter((doc) => {
        return doc.metadata?.parent_doc_id === filterByParentDoc;
      });
    } else if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = documents.filter((doc) => {
        const idMatch = doc.id.toLowerCase().includes(query);
        const textMatch = doc.text?.toLowerCase().includes(query);
        const metadataMatch = doc.metadata
          ? JSON.stringify(doc.metadata).toLowerCase().includes(query)
          : false;
        return idMatch || textMatch || metadataMatch;
      });
    }

    // Apply sorting
    if (sortBy === 'date') {
      // Sort by ID (newest first - assuming IDs are chronological or contain timestamps)
      result = [...result].sort((a, b) => b.id.localeCompare(a.id));
    } else if (sortBy === 'size') {
      // Sort by document text size (largest first)
      result = [...result].sort((a, b) => {
        const sizeA = a.text?.length || 0;
        const sizeB = b.text?.length || 0;
        return sizeB - sizeA;
      });
    }

    setFilteredDocuments(result);
    setCurrentPage(1); // Reset to first page on search/sort
  }, [searchQuery, documents, sortBy, filterByParentDoc]);

  async function fetchDocuments() {
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/documents`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      const result = await response.json();

      if (result.success && result.data) {
        const { ids, documents: docs, metadatas } = result.data;

        if (ids && Array.isArray(ids)) {
          const combinedDocs = ids.map((id: string, index: number) => ({
            id,
            text: docs && docs[index] ? docs[index] : undefined,
            metadata: metadatas && metadatas[index] ? metadatas[index] : undefined,
          }));
          setDocuments(combinedDocs);
          setFilteredDocuments(combinedDocs);
        } else {
          setDocuments([]);
          setFilteredDocuments([]);
        }
      } else {
        setDocuments([]);
        setFilteredDocuments([]);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
      setLoading(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/documents/${encodeURIComponent(docId)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
        setShowDeleteModal(false);
        setDocumentToDelete(null);
        setDeleteConfirmText('');  // Clear delete confirmation
      } else {
        toast.error('Failed to delete document');
      }
    } catch (err) {
      toast.error('Error deleting document');
    }
  }

  async function handleEditDocument() {
    if (!documentToEdit) {
      toast.error('No document selected');
      return;
    }

    // Validate metadata: no empty keys
    const hasEmptyKeys = editDocMetadata.some(item => !item.key.trim());
    if (hasEmptyKeys) {
      toast.error('Metadata keys cannot be empty');
      return;
    }

    setIsSavingEdit(true);
    try {
      // Convert metadata array back to object, keeping all values as strings
      const metadataObj: Record<string, string> = {};
      editDocMetadata.forEach(item => {
        if (item.key.trim()) {
          metadataObj[item.key.trim()] = item.value;
        }
      });

      // Extract all metadata keys for the API
      const metadataKeys = Object.keys(metadataObj);

      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/documents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idField: 'id',
            document: { id: documentToEdit.id, text: editDocText, ...metadataObj },
            metadata: metadataKeys,
            additionalParams: {},
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Document updated successfully');
        setShowEditModal(false);
        setDocumentToEdit(null);
        setEditDocText('');
        setEditDocMetadata([]);
        fetchDocuments();
      } else {
        toast.error(result.error || 'Failed to update document');
      }
    } catch (err) {
      toast.error('Error updating document');
      console.error('Edit error:', err);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleCreateDocument() {
    if (!newDocId.trim()) {
      toast.error('Please enter a document ID');
      return;
    }

    // Validate metadata: no empty keys
    const hasEmptyKeys = newDocMetadata.some(item => !item.key.trim());
    if (hasEmptyKeys) {
      toast.error('Metadata keys cannot be empty');
      return;
    }

    try {
      if (inputMode === 'url') {
        // URL-based creation with fetching
        if (!fetchUrl.trim()) {
          toast.error('Please enter a URL');
          return;
        }

        setIsFetchingUrl(true);

        // Prepare base metadata from key-value pairs
        const baseMetadata: Record<string, string> = {};
        newDocMetadata.forEach(item => {
          if (item.key.trim()) {
            baseMetadata[item.key.trim()] = item.value;
          }
        });

        // Prepare chunking options
        const chunkingOptions = enableChunking ? {
          mode: chunkingMode,
          ...(chunkingMode === 'configurable' && {
            chunkSize: chunkSize,
            overlap: chunkOverlap,
          }),
        } : undefined;

        const response = await fetch(
          `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/documents/url-fetch`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: fetchUrl.trim(),
              baseId: newDocId.trim(),
              authToken: showAuth && authToken ? authToken : undefined,
              authType: showAuth && authToken ? authType : undefined,
              enableChunking: enableChunking,
              chunkingOptions: chunkingOptions,
              baseMetadata: baseMetadata,
            }),
          }
        );

        setIsFetchingUrl(false);

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success(result.message || 'Documents created from URL successfully');
          resetCreateModal();
          fetchDocuments();
        } else {
          toast.error(result.error || 'Failed to fetch and create documents from URL');
        }
      } else {
        // Manual text creation (existing logic)
        // Convert metadata array to object
        const metadataObj: Record<string, string> = {};
        newDocMetadata.forEach(item => {
          if (item.key.trim()) {
            metadataObj[item.key.trim()] = item.value;
          }
        });

        // If no metadata provided, add a default metadata field (required by API)
        const finalMetadata = Object.keys(metadataObj).length > 0
          ? metadataObj
          : { doc_type: 'user_created' };

        const documentData = {
          id: newDocId.trim(),
          document: newDocText.trim(),
          ...finalMetadata,
        };

        const metadataFieldNames = Object.keys(finalMetadata);

        const response = await fetch(
          `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/documents`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idField: 'id',
              document: documentData,
              metadata: metadataFieldNames,
              additionalParams: {
                resource_id: newDocId.trim(),
                resource_type: 'document',
                event_type: 'add',
              },
            }),
          }
        );

        if (response.ok) {
          toast.success('Document created successfully');
          resetCreateModal();
          fetchDocuments();
        } else {
          const data = await response.json();
          const errorMessage = data.error || data.message || 'Failed to create document';
          toast.error(`Document creation failed: ${errorMessage}`);
        }
      }
    } catch (err) {
      setIsFetchingUrl(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error creating document: ${errorMessage}`);
    }
  }

  // Helper function to reset create modal state
  function resetCreateModal() {
    setShowCreateModal(false);
    setNewDocId('');
    setNewDocText('');
    setNewDocMetadata([]);
    setInputMode('manual');
    setFetchUrl('');
    setAuthToken('');
    setShowAuth(false);
    setEnableChunking(false);
    setChunkingMode('configurable');
    setChunkSize(500);
    setChunkOverlap(50);
  }

  async function handleSearch() {
    if (searchMode === 'filter') {
      // Filter mode is handled by useEffect
      return;
    }

    // Query mode - semantic search
    if (!searchQuery.trim()) {
      toast.error('Please enter search text');
      return;
    }

    setQueryLoading(true);
    setQueryResults(null);

    try {
      // Parse metadata filter if provided
      let where = null;
      if (queryMetadata.trim()) {
        try {
          where = JSON.parse(queryMetadata);
        } catch (e) {
          toast.error('Invalid JSON in metadata filter');
          setQueryLoading(false);
          return;
        }
      }

      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            queryText: searchQuery.trim(),
            nResults: queryTopK,
            where: where,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setQueryResults(result.data);
        const count = result.data.ids?.[0]?.length || 0;
        if (count === 0) {
          toast.info('No results found. Try a different query or check if documents have embeddings.');
        } else {
          toast.success(`Found ${count} similar document(s)`);
        }
      } else {
        const data = await response.json();
        toast.error(data.error || 'Query failed');
      }
    } catch (err) {
      toast.error('Error executing query');
    } finally {
      setQueryLoading(false);
    }
  }

  async function handleExport(format: 'json' | 'csv') {
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/export?format=${format}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}_export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Collection exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to export collection');
    }
  }

  async function handleImport() {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    setImportLoading(true);
    setImportProgress('Reading file...');
    setImportProgressPercent(10);

    try {
      const text = await importFile.text();
      let documents;

      setImportProgressPercent(25);

      if (importFile.name.endsWith('.json')) {
        const data = JSON.parse(text);
        // Handle both formats: direct array or wrapped in {documents: [...]}
        documents = data.documents || data;
      } else if (importFile.name.endsWith('.csv')) {
        // Parse CSV
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');

        documents = lines.slice(1).map(line => {
          // Simple CSV parsing (note: doesn't handle quoted commas)
          const values = line.split(',');
          const doc: any = {};

          headers.forEach((header, i) => {
            const value = values[i]?.trim();
            if (header === 'metadata') {
              try {
                doc.metadata = JSON.parse(value || '{}');
              } catch {
                doc.metadata = {};
              }
            } else {
              doc[header.trim()] = value;
            }
          });

          return doc;
        });
      } else {
        toast.error('Unsupported file format. Use JSON or CSV');
        setImportLoading(false);
        setImportProgressPercent(0);
        return;
      }

      setImportProgress(`Importing ${documents.length} document(s)...`);
      setImportProgressPercent(50);

      // Transform documents to ensure they use 'document' field instead of 'text'
      // and strip embedding/metadata fields (they'll be handled separately)
      const transformedDocuments = documents.map((doc: any) => {
        // If document has 'text' field but not 'document' field, rename it
        if (doc.text !== undefined && doc.document === undefined) {
          const { text, metadata, embedding, ...rest } = doc;
          return { ...rest, document: text, ...(metadata && { metadata }) };
        }
        // Strip embedding field from documents (it's not accepted by the API)
        const { embedding, ...cleanDoc } = doc;
        return cleanDoc;
      });

      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(name!)}/import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: transformedDocuments, idField: 'id' }),
        }
      );

      setImportProgressPercent(75);

      if (response.ok) {
        const result = await response.json();
        setImportProgressPercent(100);
        toast.success(result.message || 'Import successful');
        setShowImportModal(false);
        setImportFile(null);
        setImportProgress('');
        setImportProgressPercent(0);
        fetchDocuments(); // Refresh the list
      } else {
        const data = await response.json();
        let errorMessage = data.error || 'Import failed';

        // If there are individual document errors, show details
        if (data.data && data.data.errors && data.data.errors.length > 0) {
          const firstError = data.data.errors[0];
          errorMessage = `Import failed: ${firstError.error || 'Unknown error'}`;
          console.error('Import errors:', data.data.errors);
        }

        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Error importing file: ${errorMessage}`);
      console.error('Import error:', err);
    } finally {
      setImportLoading(false);
      setImportProgress('');
      setImportProgressPercent(0);
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredDocuments.length / DOCS_PER_PAGE);
  const startIndex = (currentPage - 1) * DOCS_PER_PAGE;
  const endIndex = startIndex + DOCS_PER_PAGE;
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const goToNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <DefaultLayout>
      <div className="flex w-full flex-col gap-y-4">
        {/* Sticky Header and Search */}
        <div className="sticky top-0 z-10 bg-zinc-900 pt-4 pb-4 space-y-4">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
              <div>
                <h1 className="text-3xl font-semibold text-white">{name}</h1>
                <p className="mt-1 text-sm text-gray-300">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                  {searchQuery && ` (filtered from ${documents.length} total)`}
                </p>
              </div>
            </div>

            {/* Import/Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>

              {/* Export Dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-cyan-500/50 hover:bg-dark-background/70">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-32 rounded-lg border border-white/10 bg-zinc-800 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg z-20">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Unified Search Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={searchMode === 'filter' ? "Filter by ID, text, or metadata..." : "Search using AI similarity (semantic search)..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchMode === 'query') {
                      handleSearch();
                    }
                  }}
                  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 p-1">
                <button
                  onClick={() => { setSearchMode('filter'); setQueryResults(null); }}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    searchMode === 'filter' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Filter
                </button>
                <button
                  onClick={() => setSearchMode('query')}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    searchMode === 'query' ? 'bg-cyan-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  AI Search
                </button>
              </div>

              {/* Advanced Toggle */}
              {searchMode === 'query' && (
                <button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  className={`flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white transition-all hover:border-cyan-500/50 ${
                    showAdvancedSearch ? 'border-cyan-500/50 bg-zinc-700' : ''
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Advanced
                </button>
              )}

              {/* Loading indicator for AI Search */}
              {searchMode === 'query' && queryLoading && (
                <div className="flex items-center gap-2 text-cyan-400">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">Searching...</span>
                </div>
              )}

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'none' | 'date' | 'size')}
                  className="rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 pr-10 text-white text-sm appearance-none cursor-pointer transition-all hover:border-cyan-500/50 focus:border-cyan-500/50 focus:outline-none"
                >
                  <option value="none">Default Sort</option>
                  <option value="date">Recently Created</option>
                  <option value="size">By Size</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New
              </button>
            </div>

            {/* Advanced Options */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              searchMode === 'query' && showAdvancedSearch ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="rounded-lg border border-white/10 bg-dark-background p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top-K Selector */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Results (Top-K)</label>
                    <select
                      value={queryTopK}
                      onChange={(e) => setQueryTopK(Number(e.target.value))}
                      className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white focus:border-cyan-500/50 focus:outline-none"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Metadata Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Metadata Filter (JSON)</label>
                    <input
                      type="text"
                      placeholder='{"category": "example"}'
                      value={queryMetadata}
                      onChange={(e) => setQueryMetadata(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white font-mono text-sm placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Query Results Section */}
        {searchMode === 'query' && queryResults && (
          <div className="rounded-lg border border-white/10 bg-dark-background p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              AI Search Results ({queryResults.ids?.[0]?.length || 0} found)
            </h3>

            {queryResults.ids && queryResults.ids[0] && queryResults.ids[0].length > 0 ? (
              <div className="space-y-3">
                {queryResults.ids[0].map((id: string, index: number) => (
                  <div
                    key={id || index}
                    className="rounded-lg border border-white/10 bg-dark-background/50 p-4 hover:border-cyan-500/50 hover:bg-dark-background/70 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <p className="text-sm font-mono text-cyan-400">{id}</p>
                      {queryResults.distances && queryResults.distances[0] && (
                        <span className="text-xs text-gray-500 font-mono">
                          similarity: {queryResults.distances[0][index]?.toFixed(4)}
                        </span>
                      )}
                    </div>
                    {queryResults.documents && queryResults.documents[0] && queryResults.documents[0][index] && (
                      <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                        {queryResults.documents[0][index]}
                      </p>
                    )}
                    {queryResults.metadatas && queryResults.metadatas[0] && queryResults.metadatas[0][index] && Object.keys(queryResults.metadatas[0][index]).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(queryResults.metadatas[0][index]).slice(0, 3).map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded bg-white/5 px-2 py-1 text-xs text-gray-400"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                No similar documents found
              </div>
            )}
          </div>
        )}

        {/* Documents List */}
        <div className="rounded-lg border border-white/10 bg-dark-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Documents</h2>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages || 1}
            </span>
          </div>

          {/* Filter Banner */}
          {filterByParentDoc && (
            <div className="mb-4 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span className="text-sm text-purple-300">
                  Showing chunks from parent document: <span className="font-mono text-purple-200">{filterByParentDoc}</span>
                </span>
              </div>
              <button
                onClick={() => setFilterByParentDoc(null)}
                className="flex items-center gap-1 rounded-lg bg-purple-500/20 px-3 py-1 text-sm text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filter
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-400 py-8">Loading documents...</div>
          )}

          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 p-4 text-red-400">
              <p className="font-semibold">Error loading documents</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && filteredDocuments.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? 'No documents match your search' : 'No documents found in this collection'}
            </div>
          )}

          {!loading && !error && currentDocuments.length > 0 && (
            <>
              <div className="space-y-3">
                {currentDocuments.map((doc, index) => (
                  <div
                    key={doc.id || index}
                    onClick={() => setSelectedDocument(doc)}
                    className="group relative cursor-pointer rounded-lg border border-white/10 bg-dark-background/50 p-4 transition-all hover:border-cyan-500/50 hover:bg-dark-background/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-mono text-cyan-400">{doc.id}</p>
                          {/* Chunk relationship badge */}
                          {doc.metadata?.parent_doc_id && doc.metadata?.chunk_index && doc.metadata?.total_chunks && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFilterByParentDoc(doc.metadata.parent_doc_id);
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 hover:border-purple-500/40 transition-colors"
                              title="View all chunks"
                            >
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Part {doc.metadata.chunk_index} of {doc.metadata.total_chunks}
                            </button>
                          )}
                          {/* CSV row badge */}
                          {doc.metadata?.row_index && doc.metadata?.doc_type === 'csv_row' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Row {doc.metadata.row_index}
                            </span>
                          )}
                        </div>
                        {doc.text && (
                          <p className="text-sm text-gray-300 line-clamp-2">{doc.text}</p>
                        )}
                        {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(doc.metadata).slice(0, 3).map(([key, value]) => (
                              <span
                                key={key}
                                className="rounded bg-white/5 px-2 py-1 text-xs text-gray-400"
                              >
                                {key}: {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Edit and Delete buttons (appear on hover) */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Edit button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentToEdit(doc);
                            setEditDocText(doc.text || '');
                            // Convert metadata object to key-value array
                            const metadataArray = doc.metadata
                              ? Object.entries(doc.metadata).map(([key, value]) => ({ key, value: String(value) }))
                              : [];
                            setEditDocMetadata(metadataArray);
                            setShowEditModal(true);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 transition-colors"
                          aria-label={`Edit document ${doc.id}`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDocumentToDelete(doc.id);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 transition-colors"
                          aria-label={`Delete document ${doc.id}`}
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(endIndex, filteredDocuments.length)} of {filteredDocuments.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToFirstPage}
                      disabled={currentPage === 1}
                      className="rounded border border-white/10 bg-dark-background px-3 py-1 text-white transition-all hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &laquo;
                    </button>
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="rounded border border-white/10 bg-dark-background px-3 py-1 text-white transition-all hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &lsaquo;
                    </button>
                    <span className="text-white px-4">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="rounded border border-white/10 bg-dark-background px-3 py-1 text-white transition-all hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &rsaquo;
                    </button>
                    <button
                      onClick={goToLastPage}
                      disabled={currentPage === totalPages}
                      className="rounded border border-white/10 bg-dark-background px-3 py-1 text-white transition-all hover:border-cyan-500/50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="max-w-4xl w-full max-h-[80vh] overflow-auto rounded-lg border border-white/10 bg-zinc-900 p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold text-white">Document Details</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Document ID</p>
                <p className="font-mono text-cyan-400">{selectedDocument.id}</p>
              </div>

              {selectedDocument.text && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Content</p>
                  <div className="rounded bg-white/5 p-4 text-gray-300 whitespace-pre-wrap">
                    {selectedDocument.text}
                  </div>
                </div>
              )}

              {selectedDocument.metadata && Object.keys(selectedDocument.metadata).length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Metadata</p>
                  <div className="rounded bg-white/5 p-4">
                    <pre className="text-sm text-gray-300">
                      {JSON.stringify(selectedDocument.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {showEditModal && documentToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-white/10 bg-zinc-900 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Document</h3>

            <div className="space-y-4 mb-6">
              {/* Document ID (Read-only) */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Document ID (read-only)</label>
                <input
                  type="text"
                  value={documentToEdit.id}
                  disabled
                  className="w-full rounded-lg border border-white/10 bg-zinc-800/50 px-4 py-2 text-gray-500 cursor-not-allowed"
                />
              </div>

              {/* Document Text */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Document Text</label>
                <textarea
                  placeholder="Enter document content..."
                  value={editDocText}
                  onChange={(e) => setEditDocText(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none resize-y"
                />
              </div>

              {/* Metadata Fields */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Metadata Fields</label>
                <div className="space-y-2">
                  {editDocMetadata.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) => {
                          const updated = [...editDocMetadata];
                          updated[index].key = e.target.value;
                          setEditDocMetadata(updated);
                        }}
                        className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...editDocMetadata];
                          updated[index].value = e.target.value;
                          setEditDocMetadata(updated);
                        }}
                        className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = editDocMetadata.filter((_, i) => i !== index);
                          setEditDocMetadata(updated);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Remove field"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditDocMetadata([...editDocMetadata, { key: '', value: '' }]);
                    }}
                    className="w-full rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-2 text-cyan-400 hover:bg-white/10 hover:border-cyan-500/50 transition-all"
                  >
                    + Add Metadata Field
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setDocumentToEdit(null);
                  setEditDocText('');
                  setEditDocMetadata([]);
                }}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDocument}
                disabled={isSavingEdit}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="max-w-md w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4">
            <h3 className="text-xl font-semibold text-white mb-4">Delete Document</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete document <span className="font-mono text-cyan-400">{documentToDelete}</span>? This action cannot be undone.
            </p>
            <p className="text-sm text-gray-400 mb-2">
              Type <span className="font-mono text-red-400">delete</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDocumentToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => documentToDelete && handleDeleteDocument(documentToDelete)}
                disabled={deleteConfirmText !== 'delete'}
                className="rounded-lg bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 overflow-y-auto p-4">
          <div className="max-w-3xl w-full rounded-lg border border-white/10 bg-zinc-900 p-6 my-8">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Document</h3>

            <div className="space-y-4 mb-6">
              {/* Document ID */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Document ID *</label>
                <input
                  type="text"
                  placeholder="e.g., doc_001"
                  value={newDocId}
                  onChange={(e) => setNewDocId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                />
              </div>

              {/* Input Mode Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Input Mode</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="manual"
                      checked={inputMode === 'manual'}
                      onChange={(e) => setInputMode(e.target.value as 'manual' | 'url')}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-white">Enter Text Manually</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="url"
                      checked={inputMode === 'url'}
                      onChange={(e) => setInputMode(e.target.value as 'manual' | 'url')}
                      className="text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-white">Fetch from URL</span>
                  </label>
                </div>
              </div>

              {/* Manual Text Input */}
              {inputMode === 'manual' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Document Text</label>
                  <textarea
                    placeholder="Enter document content..."
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none resize-y"
                  />
                </div>
              )}

              {/* URL Input */}
              {inputMode === 'url' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">URL *</label>
                    <input
                      type="url"
                      placeholder="https://example.com/document.html"
                      value={fetchUrl}
                      onChange={(e) => setFetchUrl(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: HTML, Markdown, Text, CSV, JSON files
                    </p>
                  </div>

                  {/* Authentication Toggle */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAuth}
                        onChange={(e) => setShowAuth(e.target.checked)}
                        className="text-cyan-500 focus:ring-cyan-500 rounded"
                      />
                      <span className="text-sm text-gray-300">This URL requires authentication</span>
                    </label>
                  </div>

                  {/* Auth Fields */}
                  {showAuth && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6 border-l-2 border-cyan-500/30">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Auth Type</label>
                        <select
                          value={authType}
                          onChange={(e) => setAuthType(e.target.value as 'bearer' | 'api-key' | 'custom')}
                          className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                        >
                          <option value="bearer">Bearer Token</option>
                          <option value="api-key">API Key</option>
                          <option value="custom">Custom Header</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Token/Key</label>
                        <input
                          type="password"
                          placeholder="Enter auth token..."
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Chunking Toggle */}
              {(inputMode === 'manual' && newDocText.length > 0) || inputMode === 'url' ? (
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={enableChunking}
                      onChange={(e) => setEnableChunking(e.target.checked)}
                      className="text-cyan-500 focus:ring-cyan-500 rounded"
                    />
                    <span className="text-white font-medium">Enable Document Chunking</span>
                  </label>

                  {enableChunking && (
                    <div className="space-y-3 pl-6 border-l-2 border-cyan-500/30">
                      {/* Chunking Mode */}
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Chunking Mode</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value="semantic"
                              checked={chunkingMode === 'semantic'}
                              onChange={(e) => setChunkingMode(e.target.value as 'semantic' | 'configurable')}
                              className="text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-white">Semantic (by paragraphs)</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              value="configurable"
                              checked={chunkingMode === 'configurable'}
                              onChange={(e) => setChunkingMode(e.target.value as 'semantic' | 'configurable')}
                              className="text-cyan-500 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-white">Configurable (size + overlap)</span>
                          </label>
                        </div>
                      </div>

                      {/* Configurable Options */}
                      {chunkingMode === 'configurable' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Chunk Size */}
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Chunk Size: <span className="text-cyan-400">{chunkSize}</span> chars
                            </label>
                            <input
                              type="number"
                              min="100"
                              max="5000"
                              step="100"
                              value={chunkSize}
                              onChange={(e) => setChunkSize(Number(e.target.value))}
                              className="w-full mb-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                            />
                            <input
                              type="range"
                              min="100"
                              max="5000"
                              step="100"
                              value={chunkSize}
                              onChange={(e) => setChunkSize(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>

                          {/* Overlap */}
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">
                              Overlap: <span className="text-cyan-400">{chunkOverlap}</span> chars
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="500"
                              step="10"
                              value={chunkOverlap}
                              onChange={(e) => setChunkOverlap(Number(e.target.value))}
                              className="w-full mb-2 rounded-lg border border-white/10 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:outline-none"
                            />
                            <input
                              type="range"
                              min="0"
                              max="500"
                              step="10"
                              value={chunkOverlap}
                              onChange={(e) => setChunkOverlap(Number(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Metadata Fields */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Metadata Fields (optional)</label>
                <div className="space-y-2">
                  {newDocMetadata.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={item.key}
                        onChange={(e) => {
                          const updated = [...newDocMetadata];
                          updated[index].key = e.target.value;
                          setNewDocMetadata(updated);
                        }}
                        className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={item.value}
                        onChange={(e) => {
                          const updated = [...newDocMetadata];
                          updated[index].value = e.target.value;
                          setNewDocMetadata(updated);
                        }}
                        className="flex-1 rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = newDocMetadata.filter((_, i) => i !== index);
                          setNewDocMetadata(updated);
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label="Remove field"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setNewDocMetadata([...newDocMetadata, { key: '', value: '' }]);
                    }}
                    className="w-full rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-2 text-cyan-400 hover:bg-white/10 hover:border-cyan-500/50 transition-all"
                  >
                    + Add Metadata Field
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={resetCreateModal}
                disabled={isFetchingUrl}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={isFetchingUrl}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isFetchingUrl && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isFetchingUrl ? 'Fetching...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => {
            // Only allow closing if not importing
            if (!importLoading) {
              setShowImportModal(false);
              setImportFile(null);
              setImportProgress('');
              setImportProgressPercent(0);
            }
          }}
        >
          <div
            className="max-w-2xl w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Import Documents</h3>

            <div className="space-y-4 mb-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Select File</label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    disabled={importLoading}
                    className="w-full rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 file:cursor-pointer focus:border-cyan-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JSON, CSV
                </p>
              </div>

              {/* File Info */}
              {importFile && (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-sm text-gray-300">
                    <span className="text-cyan-400">Selected:</span> {importFile.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Size: {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              {/* Progress */}
              {importProgress && (
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-cyan-400">{importProgress}</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-400">Progress</span>
                      <span className="text-cyan-400 font-semibold">{importProgressPercent}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Format Info */}
              {!importLoading && (
                <div className="rounded-lg bg-white/5 p-4 space-y-2">
                  <p className="text-sm text-gray-300 font-semibold">Expected Format:</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">
                      <span className="text-cyan-400">JSON:</span> Array of objects or {"{"}"documents": [...]{"}"} with fields: id, document, metadata (optional)
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="text-cyan-400">CSV:</span> Headers: id, document, metadata (JSON string)
                    </p>
                  </div>
                </div>
              )}

              {/* Warning during import */}
              {importLoading && (
                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
                  <p className="text-xs text-yellow-400">
                    Import in progress. Please do not close this window or navigate away.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportProgress('');
                  setImportProgressPercent(0);
                }}
                disabled={importLoading}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importLoading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importLoading ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DefaultLayout>
  );
}
