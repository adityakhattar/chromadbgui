import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import DefaultLayout from '@/layout/DefaultLayout';
import { API_BASE } from '@/utils/constants';
import { toast } from '@/utils/toast';

interface Collection {
  name: string;
  documentCount?: number;
  loading?: boolean;
}

export default function CollectionsHome() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);
  const [collectionToEdit, setCollectionToEdit] = useState<string | null>(null);
  const [editedCollectionName, setEditedCollectionName] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    // Filter collections based on search query
    if (searchQuery.trim() === '') {
      setFilteredCollections(collections);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = collections.filter((c) =>
        c.name.toLowerCase().includes(query)
      );
      setFilteredCollections(filtered);
    }
  }, [searchQuery, collections]);

  async function fetchCollections() {
    try {
      const response = await fetch(`${API_BASE}/api/chroma/collections`);
      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.success && data.data) {
        const collectionsArray = Array.isArray(data.data) ? data.data : [];
        const collectionsWithMeta = collectionsArray.map((name: string) => ({
          name,
          documentCount: undefined,
          loading: true,
        }));
        setCollections(collectionsWithMeta);
        setFilteredCollections(collectionsWithMeta);
        setLoading(false);

        // Fetch document counts for each collection
        collectionsWithMeta.forEach((collection: Collection) => {
          fetchDocumentCount(collection.name);
        });
      } else {
        setCollections([]);
        setFilteredCollections([]);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
      setLoading(false);
    }
  }

  async function fetchDocumentCount(collectionName: string) {
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${collectionName}/documents`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { ids } = result.data;
          const count = ids && Array.isArray(ids) ? ids.length : 0;

          setCollections((prev) =>
            prev.map((c) =>
              c.name === collectionName
                ? { ...c, documentCount: count, loading: false }
                : c
            )
          );
        }
      }
    } catch (err) {
      setCollections((prev) =>
        prev.map((c) =>
          c.name === collectionName
            ? { ...c, documentCount: 0, loading: false }
            : c
        )
      );
    }
  }

  async function handleCreateCollection() {
    if (!newCollectionName.trim()) {
      toast.error('Please enter a collection name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chroma/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName.trim() }),
      });

      if (response.ok) {
        toast.success('Collection created successfully');
        setShowCreateModal(false);
        setNewCollectionName('');
        fetchCollections();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create collection');
      }
    } catch (err) {
      toast.error('Error creating collection');
    }
  }

  async function handleDeleteCollection(collectionName: string) {
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(collectionName)}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast.success('Collection deleted successfully');
        setShowDeleteModal(false);
        setCollectionToDelete(null);
        setDeleteConfirmText(''); // Clear delete confirmation
        fetchCollections();
      } else {
        toast.error('Failed to delete collection');
      }
    } catch (err) {
      toast.error('Error deleting collection');
    }
  }

  async function handleRenameCollection() {
    if (!collectionToEdit || !editedCollectionName.trim()) {
      toast.error('Please enter a new collection name');
      return;
    }

    if (editedCollectionName.trim() === collectionToEdit) {
      toast.error('New name must be different from current name');
      return;
    }

    setIsRenaming(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/chroma/collections/${encodeURIComponent(collectionToEdit)}/rename`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newName: editedCollectionName.trim() }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Collection renamed successfully');
        setShowEditModal(false);
        setCollectionToEdit(null);
        setEditedCollectionName('');
        fetchCollections();
      } else {
        toast.error(result.error || 'Failed to rename collection');
      }
    } catch (err) {
      toast.error('Error renaming collection');
      console.error('Rename error:', err);
    } finally {
      setIsRenaming(false);
    }
  }

  function handleCollectionClick(collectionName: string) {
    navigate(`/collection/${encodeURIComponent(collectionName)}`);
  }

  return (
    <DefaultLayout>
      <div className="flex w-full flex-col gap-y-4">
        {/* Sticky Header and Search */}
        <div className="sticky top-0 z-10 bg-zinc-900 pt-4 pb-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Collections</h1>
              <p className="mt-2 text-sm text-gray-300">
                Manage your ChromaDB collections and vector data
              </p>
            </div>
          </div>

          {/* Search and Create */}
          <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <label htmlFor="search-collections" className="sr-only">
              Search collections
            </label>
            <input
              id="search-collections"
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 pl-10 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              aria-label="Search collections"
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-label="Create new collection"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Collection
          </button>
          </div>
        </div>

        {/* Collections List */}
        <div className="rounded-lg border border-white/10 bg-dark-background p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Collections</h2>
            <span className="text-sm text-gray-400">
              {filteredCollections.length} {searchQuery && `of ${collections.length}`} total
            </span>
          </div>

          {loading && (
            <div className="text-center text-gray-400 py-8">
              Loading collections...
            </div>
          )}

          {error && (
            <div className="rounded border border-red-500/50 bg-red-500/10 p-4 text-red-400">
              <p className="font-semibold">Error loading collections</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && filteredCollections.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              {searchQuery ? 'No collections match your search' : 'No collections found'}
            </div>
          )}

          {!loading && !error && filteredCollections.length > 0 && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredCollections.map((collection, index) => (
                <motion.div
                  key={collection.name}
                  onClick={() => handleCollectionClick(collection.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCollectionClick(collection.name);
                    }
                  }}
                  className="relative group cursor-pointer rounded-lg border border-white/10 bg-dark-background/50 p-4 transition-all hover:border-cyan-500/50 hover:bg-dark-background/70 hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open collection ${collection.name}, ${collection.documentCount !== undefined ? collection.documentCount : '--'} documents`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white pr-8">{collection.name}</h3>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-cyan-400 font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                        See inside! →
                      </p>
                      <p className="text-sm text-gray-400">
                        {collection.loading ? (
                          <span className="animate-pulse">...</span>
                        ) : collection.documentCount !== undefined ? (
                          <span>
                            {collection.documentCount.toLocaleString()} doc
                            {collection.documentCount !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span>-- docs</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Edit and Delete buttons (appear on hover) */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCollectionToEdit(collection.name);
                        setShowEditModal(true);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700"
                      aria-label={`Edit collection ${collection.name}`}
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
                        setCollectionToDelete(collection.name);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700"
                      aria-label={`Delete collection ${collection.name}`}
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Collection Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setShowCreateModal(false);
              setNewCollectionName('');
            }}
          >
            <motion.div
              className="max-w-md w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="create-collection-title"
              aria-modal="true"
            >
            <h3 id="create-collection-title" className="text-xl font-semibold text-white mb-4">Create New Collection</h3>
            <input
              type="text"
              placeholder="Collection name..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateCollection()}
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none mb-6"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCollectionName('');
                }}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600"
              >
                Create
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit (Rename) Collection Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setShowEditModal(false);
              setCollectionToEdit(null);
              setEditedCollectionName('');
            }}
          >
            <motion.div
              className="max-w-md w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="edit-collection-title"
              aria-modal="true"
            >
            <h3 id="edit-collection-title" className="text-xl font-semibold text-white mb-4">Rename Collection</h3>
            <p className="text-sm text-gray-400 mb-2">
              Current name: <span className="font-mono text-cyan-400">{collectionToEdit}</span>
            </p>
            <p className="text-sm text-gray-300 mb-2">New name:</p>
            <input
              type="text"
              value={editedCollectionName}
              onChange={(e) => setEditedCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && editedCollectionName.trim()) {
                  handleRenameCollection();
                }
              }}
              placeholder="Enter new collection name"
              className="w-full rounded-lg border border-white/10 bg-zinc-800 px-4 py-2 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:outline-none mb-2"
              autoFocus
            />
            <p className="text-xs text-yellow-400 mb-6">
              ⚠️ This will rename the collection. All documents will be preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCollectionToEdit(null);
                  setEditedCollectionName('');
                }}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameCollection}
                disabled={isRenaming || !editedCollectionName.trim()}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-white transition-all hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenaming ? 'Renaming...' : 'Rename Collection'}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Collection Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setShowDeleteModal(false);
              setCollectionToDelete(null);
              setDeleteConfirmText('');
            }}
          >
            <motion.div
              className="max-w-md w-full rounded-lg border border-white/10 bg-zinc-900 p-6 m-4"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="delete-collection-title"
              aria-modal="true"
            >
            <h3 id="delete-collection-title" className="text-xl font-semibold text-white mb-4">Delete Collection</h3>
            <p className="text-gray-300 mb-4">
              Are you sure you want to delete collection <span className="font-mono text-cyan-400">{collectionToDelete}</span>?
              This will delete all documents in the collection. This action cannot be undone.
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
                  setCollectionToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="rounded-lg border border-white/10 bg-dark-background px-4 py-2 text-white transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => collectionToDelete && handleDeleteCollection(collectionToDelete)}
                disabled={deleteConfirmText !== 'delete'}
                className="rounded-lg bg-red-500 px-4 py-2 text-white transition-all hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DefaultLayout>
  );
}
