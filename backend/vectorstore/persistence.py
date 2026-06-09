import os
from .base import VectorStore
from services.logger import logger

FAISS_STORAGE_DIR = "storage/faiss"

class IndexPersistenceManager:
    """
    Manages the disk persistence of vector store indexes.
    Abstracts away file paths and handles startup restoration.
    """
    def __init__(self, vector_store: VectorStore, storage_dir: str = FAISS_STORAGE_DIR):
        self.vector_store = vector_store
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def _get_path(self, user_id: str) -> str:
        return os.path.join(self.storage_dir, f"{user_id}.index")

    def save_user_index(self, user_id: str):
        path = self._get_path(user_id)
        self.vector_store.save_index(user_id, path)
        logger.info(f"Saved FAISS index to disk for user {user_id}")

    def load_user_index(self, user_id: str) -> bool:
        path = self._get_path(user_id)
        if os.path.exists(path):
            success = self.vector_store.load_index(user_id, path)
            if success:
                logger.info(f"Loaded FAISS index from disk for user {user_id}")
            return success
        return False
        
    def delete_user_index_file(self, user_id: str):
        path = self._get_path(user_id)
        if os.path.exists(path):
            os.remove(path)
            logger.info(f"Deleted FAISS index file for user {user_id}")
            
    def get_user_index_size(self, user_id: str) -> int:
        path = self._get_path(user_id)
        if os.path.exists(path):
            return os.path.getsize(path)
        return 0

    def restore_all_indexes(self):
        """
        Scan the storage directory and load all .index files on startup.
        """
        count = 0
        if not os.path.exists(self.storage_dir):
            return count
            
        for filename in os.listdir(self.storage_dir):
            if filename.endswith(".index"):
                user_id = filename.replace(".index", "")
                success = self.load_user_index(user_id)
                if success:
                    count += 1
        logger.info(f"Restored {count} FAISS indexes from disk.")
        return count
