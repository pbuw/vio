'use client';

import { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export default function TemplateSelector({ onTemplateApplied }: { onTemplateApplied?: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.filter((t: Template) => t.isActive));
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (replaceExisting: boolean) => {
    if (!selectedTemplateId) return;

    setApplying(true);
    try {
      const response = await fetch('/api/templates/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          replaceExisting,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Template erfolgreich angewendet: ${data.message}`);
        setSelectedTemplateId('');
        setShowConfirm(false);
        if (onTemplateApplied) {
          onTemplateApplied();
        }
        // Refresh the page to show new categories
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Fehler beim Anwenden des Templates');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
        <p className="text-[#2D3436]/60 font-inter">Templates werden geladen...</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <h3 className="text-lg font-semibold mb-4 text-[#2D3436] font-poppins">
        Template anwenden
      </h3>
      <p className="text-sm text-[#2D3436]/60 mb-4 font-inter">
        Wähle ein Template für deine Zusatzversicherung aus, um automatisch Kategorien, Deckungsregeln und Budgets einzurichten.
      </p>

      <div className="space-y-3">
        <div className="relative">
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full px-4 py-3.5 pr-10 border-2 border-[#2D3436]/10 rounded-xl bg-white text-[#2D3436] font-inter font-medium focus:outline-none focus:ring-2 focus:ring-[#5844AC]/30 focus:border-[#5844AC]/30 transition-all appearance-none cursor-pointer hover:border-[#5844AC]/20"
          >
            <option value="" disabled className="text-[#2D3436]/40">
              Template auswählen
            </option>
            {templates.map((template) => (
              <option key={template.id} value={template.id} className="text-[#2D3436]">
                {template.name}
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

        {selectedTemplateId && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={applying}
            className="w-full bg-[#5844AC] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#5844AC]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-poppins"
          >
            Template anwenden
          </button>
        )}

        {showConfirm && (
          <div className="space-y-3 p-4 bg-[#F9FAFC] rounded-xl border border-[#2D3436]/5">
            <p className="text-sm text-[#2D3436] font-inter font-medium">
              Möchtest du deine bestehenden Kategorien ersetzen oder hinzufügen?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleApplyTemplate(true)}
                disabled={applying}
                className="flex-1 bg-[#5844AC] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#5844AC]/90 disabled:opacity-50 transition-all font-inter"
              >
                {applying ? 'Wird angewendet...' : 'Ersetzen'}
              </button>
              <button
                onClick={() => handleApplyTemplate(false)}
                disabled={applying}
                className="flex-1 bg-[#8E7CE8] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#8E7CE8]/90 disabled:opacity-50 transition-all font-inter"
              >
                {applying ? 'Wird angewendet...' : 'Hinzufügen'}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedTemplateId('');
                }}
                disabled={applying}
                className="px-4 py-2 text-[#2D3436]/60 hover:text-[#2D3436] font-inter transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

