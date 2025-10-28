export const API_BASE = import.meta.env.VITE_API_BASE || '/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'VDMS';
export const STORE_USER = 'vdms_user';
export const STORE_TOKEN = 'vdms_authToken';
export const COMPLETE_QUESTIONNAIRE = 'vectoradmin_completed_questionnaire';
export const COMPLETE_ONBOARDING = 'vectoradmin_completed_onboarding';
export const SUPPORTED_VECTOR_DBS = [
  'pinecone',
  'chroma',
  'qdrant',
  'weaviate',
];

export type ISearchTypes = 'semantic' | 'exactText' | 'metadata' | 'vectorId';
export const SEARCH_MODES = {
  exactText: {
    display: 'Fuzzy Text Search',
    placeholder: 'Find embedding via a fuzzy text match on your query.',
  },
  semantic: {
    display: 'Semantic Search',
    placeholder:
      'Search with natural language finding the most similar embedding by meaning. Use of this search will cost OpenAI credits to embed the query.',
  },
  metadata: {
    display: 'Metadata',
    placeholder:
      'Find embedding by exact key:value pair. Formatted as key:value_to_look_for',
  },
  vectorId: {
    display: 'Vector Id',
    placeholder: 'Find by a specific vector ID',
  },
};
