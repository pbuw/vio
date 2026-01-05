'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface CoverageCalculation {
  basicCoverage: number;
  supplementaryCoverage: number;
  userPays: number;
}

interface Expense {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  subCategoryId: string;
  subCategory: {
    id: string;
    name: string;
    categoryId: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface ExpenseDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: string;
  createdAt: string;
}

interface ExpenseFormProps {
  onClose?: () => void;
  expense?: Expense | null;
}

export default function ExpenseForm({ onClose, expense }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [calculation, setCalculation] = useState<CoverageCalculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingDocuments, setExistingDocuments] = useState<ExpenseDocument[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [documentType, setDocumentType] = useState<string>('invoice');

  const isEditMode = !!expense;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (expense) {
      // Pre-fill form with expense data
      setSelectedCategoryId(expense.subCategory.category.id);
      setSelectedSubCategoryId(expense.subCategory.id);
      setAmount(expense.amount.toString());
      setDescription(expense.description || '');
      setDate(new Date(expense.date).toISOString().split('T')[0]);
      fetchExistingDocuments(expense.id);
    } else {
      // Reset form when expense is cleared (edit mode cancelled)
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setSelectedCategoryId('');
      setSelectedSubCategoryId('');
      setCalculation(null);
      setSelectedFiles([]);
      setExistingDocuments([]);
    }
  }, [expense]);

  useEffect(() => {
    if (selectedSubCategoryId && amount) {
      calculateCoverage();
    } else {
      setCalculation(null);
    }
  }, [selectedSubCategoryId, amount]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchExistingDocuments = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setExistingDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '5242880', 10);
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        alert(`Datei ${file.name} hat einen nicht unterstützten Typ. Erlaubt: PDF, JPG, PNG`);
        return false;
      }
      if (file.size > maxSize) {
        alert(`Datei ${file.name} ist zu groß. Maximum: ${maxSize / 1024 / 1024}MB`);
        return false;
      }
      return true;
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Möchtest du dieses Dokument wirklich löschen?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/expenses/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setExistingDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        alert('Fehler beim Löschen des Dokuments');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Fehler beim Löschen des Dokuments');
    }
  };

  const uploadFiles = async (expenseId: string) => {
    if (selectedFiles.length === 0) {
      return;
    }

    setUploadingFiles(true);
    try {
      const formData = new FormData();
      formData.append('expenseId', expenseId);
      formData.append('documentType', documentType);
      
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/expenses/documents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setExistingDocuments(prev => [...prev, ...data.documents]);
        setSelectedFiles([]);
      } else {
        const error = await response.json();
        alert(`Fehler beim Hochladen: ${error.error}`);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Fehler beim Hochladen der Dateien');
    } finally {
      setUploadingFiles(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const calculateCoverage = async () => {
    if (!selectedSubCategoryId || !amount || parseFloat(amount) <= 0) {
      setCalculation(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/expenses/calculate?amount=${amount}&subCategoryId=${selectedSubCategoryId}`
      );
      const data = await response.json();
      setCalculation(data);
    } catch (error) {
      console.error('Error calculating coverage:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubCategoryId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditMode ? '/api/expenses' : '/api/expenses';
      const method = isEditMode ? 'PUT' : 'POST';
      const body = isEditMode
        ? {
            id: expense.id,
            amount: parseFloat(amount),
            date,
            description,
            subCategoryId: selectedSubCategoryId,
          }
        : {
            amount: parseFloat(amount),
            date,
            description,
            subCategoryId: selectedSubCategoryId,
          };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const expenseData = await response.json();
        const expenseId = expenseData.id || expense?.id;
        
        // Upload files if any selected
        if (selectedFiles.length > 0) {
          await uploadFiles(expenseId);
        }
        
        // Trigger refresh in parent first
        window.dispatchEvent(new Event(isEditMode ? 'expenseUpdated' : 'expenseAdded'));
        // Close form if onClose callback provided (this will reset the form via parent state)
        if (onClose) {
          onClose();
        } else {
          // Only reset form if no onClose callback (shouldn't happen in normal flow)
          setAmount('');
          setDescription('');
          setDate(new Date().toISOString().split('T')[0]);
          setSelectedCategoryId('');
          setSelectedSubCategoryId('');
          setCalculation(null);
          setSelectedFiles([]);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} expense:`, error);
      alert(`Ups, die Ausgabe konnte nicht ${isEditMode ? 'aktualisiert' : 'erstellt'} werden. Bitte versuche es noch einmal.`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const availableSubCategories = selectedCategory?.subCategories || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <h2 className="text-xl font-semibold text-[#2D3436] font-poppins mb-4">
        {isEditMode ? 'Ausgabe bearbeiten' : 'Ausgabe hinzufügen'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Kategorie
          </label>
          <div className="relative">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setSelectedSubCategoryId('');
              }}
              className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20"
              required
            >
              <option value="" disabled className="text-[#2D3436]/40">
                Kategorie auswählen
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="text-[#2D3436]">
                  {category.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-[#5844AC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Unterkategorie
          </label>
          <div className="relative">
            <select
              value={selectedSubCategoryId}
              onChange={(e) => setSelectedSubCategoryId(e.target.value)}
              className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#2D3436]/10"
              required
              disabled={!selectedCategoryId}
            >
              <option value="" disabled className="text-[#2D3436]/40">
                {selectedCategoryId ? 'Unterkategorie auswählen' : 'Wähle zuerst eine Kategorie'}
              </option>
              {availableSubCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id} className="text-[#2D3436]">
                  {subCategory.name}
                </option>
              ))}
            </select>
            <div className={`absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none ${!selectedCategoryId ? 'opacity-50' : ''}`}>
              <svg
                className="w-5 h-5 text-[#5844AC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {!selectedCategoryId && (
            <p className="mt-1.5 text-xs text-[#2D3436]/50 font-inter">
              Bitte wähle zuerst eine Kategorie aus
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Betrag (CHF)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[#2D3436] font-inter">
            Beschreibung (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 border border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/20 transition-all"
            placeholder="z.B. Massage"
          />
        </div>

        {calculation && (
          <div className="bg-[#F9FAFC] rounded-xl p-5 space-y-3 border border-[#2D3436]/5">
            <h3 className="font-semibold text-[#2D3436] font-poppins">Deine Deckung</h3>
            <div className="grid grid-cols-2 gap-3 text-sm font-inter">
              <div className="text-[#2D3436]/60">Grundversicherung:</div>
              <div className="font-semibold text-[#5844AC] font-poppins">
                CHF {calculation.basicCoverage.toFixed(2)}
              </div>
              <div className="text-[#2D3436]/60">Zusatzversicherung:</div>
              <div className="font-semibold text-[#00C896] font-poppins">
                CHF {calculation.supplementaryCoverage.toFixed(2)}
              </div>
              <div className="text-[#2D3436]/60">Dein Anteil:</div>
              <div className="font-semibold text-[#FF8080] font-poppins">
                CHF {calculation.userPays.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Dokumenttyp
          </label>
          <div className="relative">
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20"
            >
              <option value="invoice">Rechnung</option>
              <option value="reimbursement">Rückforderungsbeleg</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg
                className="w-5 h-5 text-[#5844AC]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
            Dokumente hochladen (optional)
          </label>
          <div className="space-y-3">
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleFileSelect}
                className="w-full px-4 py-3 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#5844AC] file:text-white hover:file:bg-[#5844AC]/90 cursor-pointer"
              />
            </div>
            <p className="text-xs text-[#2D3436]/50 font-inter">
              Erlaubte Formate: PDF, JPG, PNG. Max. 5MB pro Datei.
            </p>
            
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-[#F9FAFC] rounded-xl border border-[#2D3436]/5"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg
                        className="w-5 h-5 text-[#5844AC] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2D3436] truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#2D3436]/50">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 p-1.5 text-[#FF8080] hover:bg-[#FF8080]/10 rounded-lg transition-colors"
                      title="Entfernen"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {existingDocuments.length > 0 && (
          <div>
            <label className="block text-sm font-semibold mb-2.5 text-[#2D3436] font-inter">
              Bereits hochgeladene Dokumente
            </label>
            <div className="space-y-2">
              {existingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-[#F9FAFC] rounded-xl border border-[#2D3436]/5"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg
                      className="w-5 h-5 text-[#5844AC] flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#2D3436] truncate">
                        {doc.fileName}
                      </p>
                      <p className="text-xs text-[#2D3436]/50">
                        {formatFileSize(doc.fileSize)} • {doc.documentType === 'reimbursement' ? 'Rückforderungsbeleg' : 'Rechnung'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/expenses/documents/${doc.id}`}
                      download
                      className="p-1.5 text-[#5844AC] hover:bg-[#5844AC]/10 rounded-lg transition-colors"
                      title="Herunterladen"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-[#FF8080] hover:bg-[#FF8080]/10 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || uploadingFiles || !selectedSubCategoryId || !amount}
          className="w-full bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-poppins"
        >
          {submitting || uploadingFiles
            ? isEditMode
              ? 'Wird aktualisiert...'
              : 'Wird gespeichert...'
            : isEditMode
            ? 'Ausgabe aktualisieren'
            : 'Ausgabe hinzufügen'}
        </button>
      </form>
    </div>
  );
}

