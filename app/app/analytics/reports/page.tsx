
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Download, 
  Plus, 
  Search,
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  Filter,
  Eye
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch(`/api/analytics/reports?type=${filterType}&search=${searchTerm}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [searchTerm, filterType]);

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'ANALYTICS':
        return 'bg-blue-100 text-blue-800';
      case 'FINANCIAL':
        return 'bg-green-100 text-green-800';
      case 'PROJECT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'ANALYTICS':
        return <BarChart3 className="h-4 w-4" />;
      case 'FINANCIAL':
        return <PieChart className="h-4 w-4" />;
      case 'PROJECT':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Berichte</h1>
          <p className="text-gray-600 mt-2">
            Erstellen und verwalten Sie automatisierte Geschäftsberichte
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Bericht
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Berichte durchsuchen..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Typ auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Typen</SelectItem>
            <SelectItem value="ANALYTICS">Analytics</SelectItem>
            <SelectItem value="FINANCIAL">Finanzen</SelectItem>
            <SelectItem value="PROJECT">Projekte</SelectItem>
            <SelectItem value="CUSTOM">Benutzerdefiniert</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Erweiterte Filter
        </Button>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: 'Gesamt Berichte', value: reports.length, icon: FileText },
          { title: 'Generiert heute', value: '3', icon: Calendar },
          { title: 'Automatisiert', value: '12', icon: TrendingUp },
          { title: 'Geteilt', value: '8', icon: Eye },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Reports Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        {reports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report, index) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getReportIcon(report.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.name}</CardTitle>
                          <Badge 
                            variant="secondary" 
                            className={getReportTypeColor(report.type)}
                          >
                            {report.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {report.description && (
                      <CardDescription className="mt-2">
                        {report.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Erstellt am:</span>
                        <span className="font-medium">{formatDate(report.createdAt)}</span>
                      </div>
                      {report.user && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Erstellt von:</span>
                          <span className="font-medium">{report.user.name || report.user.email}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-3 border-t">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          Anzeigen
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Berichte gefunden
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== 'all' 
                  ? 'Keine Berichte entsprechen Ihren Suchkriterien.' 
                  : 'Erstellen Sie Ihren ersten automatisierten Geschäftsbericht.'
                }
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Bericht erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Report Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Vorgefertigte Vorlagen</CardTitle>
            <CardDescription>
              Schnell starten mit bewährten Berichtsvorlagen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  name: 'Monatlicher Geschäftsbericht',
                  description: 'Übersicht über KPIs, Umsatz und Kundenmetriken',
                  type: 'ANALYTICS',
                  icon: BarChart3
                },
                {
                  name: 'Finanzanalyse Report',
                  description: 'Detaillierte Analyse von Einnahmen und Ausgaben',
                  type: 'FINANCIAL',
                  icon: PieChart
                },
                {
                  name: 'Projektfortschritt Report',
                  description: 'Status und Performance aller laufenden Projekte',
                  type: 'PROJECT',
                  icon: TrendingUp
                }
              ].map((template) => {
                const Icon = template.icon;
                return (
                  <div
                    key={template.name}
                    className="p-4 border rounded-lg hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <Badge 
                          variant="secondary" 
                          className={`mt-2 ${getReportTypeColor(template.type)}`}
                        >
                          {template.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
