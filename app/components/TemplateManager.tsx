'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import TemplateForm from './TemplateForm';

interface Template {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  templateCategories: any[];
}

export default function TemplateManager() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'superadmin') {
      fetchTemplates();
    }
  }, [session]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Möchtest du dieses Template wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Fehler beim Löschen des Templates');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          isActive: !template.isActive,
        }),
      });

      if (response.ok) {
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Fehler beim Aktualisieren des Templates');
    }
  };

  const handleEdit = async (template: Template) => {
    try {
      // Fetch full template data with all nested relations
      const response = await fetch(`/api/templates/${template.id}`);
      if (response.ok) {
        const fullTemplate = await response.json();
        setEditingTemplate(fullTemplate);
        setShowForm(true);
      } else {
        const error = await response.json();
        alert(`Fehler beim Laden: ${error.error}`);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Fehler beim Laden des Templates');
    }
  };

  const handleSave = async (data: any) => {
    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchTemplates();
        setShowForm(false);
        setEditingTemplate(null);
        alert(editingTemplate ? 'Template erfolgreich aktualisiert' : 'Template erfolgreich erstellt');
      } else {
        const error = await response.json();
        alert(`Fehler: ${error.error}`);
        throw new Error(error.error);
      }
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  if (!session?.user || (session.user as any).role !== 'superadmin') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
        <p className="text-[#2D3436]/60 font-inter">Templates werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#2D3436]/5">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#2D3436] font-poppins">
          Template-Verwaltung
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTemplate(null);
            setFormData({ name: '', description: '', isActive: true });
          }}
          className="px-6 py-3 bg-[#5844AC] text-white rounded-xl font-semibold hover:bg-[#5844AC]/90 transition-all shadow-sm font-poppins"
        >
          + Neues Template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="text-[#2D3436]/60 font-inter">Noch keine Templates vorhanden.</p>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="p-4 border border-[#2D3436]/10 rounded-xl bg-[#F9FAFC]"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[#2D3436] font-poppins">
                      {template.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-lg font-inter ${
                        template.isActive
                          ? 'bg-[#00C896]/10 text-[#00C896]'
                          : 'bg-[#2D3436]/10 text-[#2D3436]/60'
                      }`}
                    >
                      {template.isActive ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-[#2D3436]/60 font-inter mb-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-[#2D3436]/50 font-inter">
                    {template.templateCategories.length} Kategorie(n)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="px-3 py-1.5 text-sm bg-[#5844AC] text-white rounded-xl hover:bg-[#5844AC]/90 font-inter transition-all"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-3 py-1.5 text-sm rounded-xl font-inter transition-all ${
                      template.isActive
                        ? 'bg-[#2D3436]/10 text-[#2D3436] hover:bg-[#2D3436]/20'
                        : 'bg-[#00C896]/10 text-[#00C896] hover:bg-[#00C896]/20'
                    }`}
                  >
                    {template.isActive ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-1.5 text-sm text-[#FF8080] hover:bg-[#FF8080]/10 rounded-xl font-inter transition-all"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-6 bg-[#F9FAFC] rounded-xl border border-[#2D3436]/5">
          <h3 className="text-lg font-semibold mb-4 text-[#2D3436] font-poppins">
            {editingTemplate ? 'Template bearbeiten' : 'Neues Template erstellen'}
          </h3>
          <TemplateForm
            template={editingTemplate || undefined}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditingTemplate(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

