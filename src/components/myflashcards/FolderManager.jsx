import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Save, X } from 'lucide-react';

export default function FolderManager({ folders, onRename, onDelete }) {
  const [editingFolder, setEditingFolder] = useState(null);
  const [newName, setNewName] = useState('');

  const handleStartEdit = (folder) => {
    setEditingFolder(folder);
    setNewName(folder);
  };

  const handleCancelEdit = () => {
    setEditingFolder(null);
    setNewName('');
  };

  const handleSaveEdit = () => {
    if (newName.trim()) {
      onRename(editingFolder, newName);
    }
    handleCancelEdit();
  };

  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
      {folders.length === 0 ? (
        <p className="text-slate-500 text-center py-4">Nenhuma pasta criada ainda.</p>
      ) : (
        folders.map((folder) => (
          <div key={folder} className="flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg">
            {editingFolder === folder ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  className="bg-white"
                />
                <Button variant="ghost" size="icon" onClick={handleSaveEdit}>
                  <Save className="w-5 h-5 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X className="w-5 h-5 text-red-600" />
                </Button>
              </div>
            ) : (
              <>
                <span className="font-medium text-slate-800 flex-1 truncate pr-2">{folder}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleStartEdit(folder)} className="hover:bg-blue-100">
                    <Edit className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(folder)} className="hover:bg-red-100">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}