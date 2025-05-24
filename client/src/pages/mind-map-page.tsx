import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Workflow, Plus, Save, Download, Sparkles, Eye, Share2,
  ZoomIn, ZoomOut, RotateCcw, Maximize, Edit3, Trash2
} from "lucide-react";
import ReactFlow, { 
  Node, 
  Edge, 
  addEdge, 
  Connection, 
  useNodesState, 
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MindMap } from "@shared/schema";
import { SUBJECTS, GRADE_LEVELS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

interface MindMapGenerateForm {
  topic: string;
  subject: string;
  depth: number;
}

export default function MindMapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMindMap, setSelectedMindMap] = useState<MindMap | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Mind map generation form
  const [generateForm, setGenerateForm] = useState<MindMapGenerateForm>({
    topic: "",
    subject: "",
    depth: 3,
  });

  const [saveMindMapForm, setSaveMindMapForm] = useState({
    title: "",
    isPublic: false,
  });

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Fetch mind maps
  const { data: mindMaps, isLoading: mindMapsLoading } = useQuery<MindMap[]>({
    queryKey: ['/api/mind-maps'],
  });

  // Generate mind map mutation
  const generateMindMapMutation = useMutation({
    mutationFn: async (data: MindMapGenerateForm) => {
      const response = await apiRequest('POST', '/api/ai/generate-mind-map', data);
      return response.json();
    },
    onSuccess: (data) => {
      const { nodes: generatedNodes, edges: generatedEdges } = convertMindMapToFlow(data.mindMapData);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
      setSaveMindMapForm(prev => ({ ...prev, title: generateForm.topic }));
      toast({
        title: "Mind Map Generated!",
        description: "Your AI mind map has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate mind map.",
        variant: "destructive",
      });
    },
  });

  // Save mind map mutation
  const saveMindMapMutation = useMutation({
    mutationFn: async (mindMapData: any) => {
      const response = await apiRequest('POST', '/api/mind-maps', mindMapData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mind-maps'] });
      toast({
        title: "Mind Map Saved!",
        description: "Your mind map has been saved successfully.",
      });
      setSaveMindMapForm({ title: "", isPublic: false });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const convertMindMapToFlow = (mindMapData: MindMapNode) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let nodeId = 0;

    const addNodeRecursively = (
      nodeData: MindMapNode, 
      x: number, 
      y: number, 
      level: number = 0,
      parentId?: string
    ) => {
      const currentNodeId = `node-${nodeId++}`;
      
      // Calculate node styling based on level
      const getNodeStyle = (level: number) => {
        switch (level) {
          case 0: // Root node
            return {
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '12px 24px',
              borderRadius: '20px',
              border: 'none',
              minWidth: '180px',
              textAlign: 'center' as const,
            };
          case 1: // First level
            return {
              background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              padding: '10px 20px',
              borderRadius: '16px',
              border: 'none',
              minWidth: '140px',
              textAlign: 'center' as const,
            };
          case 2: // Second level
            return {
              background: 'linear-gradient(135deg, #8B5CF6 0%, #10B981 100%)',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              padding: '8px 16px',
              borderRadius: '12px',
              border: 'none',
              minWidth: '120px',
              textAlign: 'center' as const,
            };
          default: // Third level and beyond
            return {
              background: '#F3F4F6',
              color: '#374151',
              fontSize: '11px',
              fontWeight: '500',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '2px solid #E5E7EB',
              minWidth: '100px',
              textAlign: 'center' as const,
            };
        }
      };

      nodes.push({
        id: currentNodeId,
        type: 'default',
        position: { x, y },
        data: { label: nodeData.label },
        style: getNodeStyle(level),
      });

      if (parentId) {
        edges.push({
          id: `edge-${parentId}-${currentNodeId}`,
          source: parentId,
          target: currentNodeId,
          type: 'smoothstep',
          style: { 
            stroke: level === 1 ? '#3B82F6' : level === 2 ? '#10B981' : '#8B5CF6',
            strokeWidth: Math.max(3 - level, 1)
          },
          animated: level <= 1,
        });
      }

      // Add children in a circular pattern around the parent
      if (nodeData.children && nodeData.children.length > 0) {
        const childCount = nodeData.children.length;
        const radius = 200 + (level * 50);
        const angleStep = (2 * Math.PI) / childCount;

        nodeData.children.forEach((child, index) => {
          const angle = index * angleStep - Math.PI / 2; // Start from top
          const childX = x + Math.cos(angle) * radius;
          const childY = y + Math.sin(angle) * radius;
          
          addNodeRecursively(child, childX, childY, level + 1, currentNodeId);
        });
      }
    };

    addNodeRecursively(mindMapData, 400, 300);
    return { nodes, edges };
  };

  const handleGenerateMindMap = () => {
    if (!generateForm.topic || !generateForm.subject) {
      toast({
        title: "Missing Information",
        description: "Please enter a topic and select a subject.",
        variant: "destructive",
      });
      return;
    }

    generateMindMapMutation.mutate(generateForm);
  };

  const handleSaveMindMap = () => {
    if (!saveMindMapForm.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please enter a title for your mind map.",
        variant: "destructive",
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "No Mind Map to Save",
        description: "Please generate or create a mind map first.",
        variant: "destructive",
      });
      return;
    }

    saveMindMapMutation.mutate({
      title: saveMindMapForm.title,
      subject: generateForm.subject,
      data: { nodes, edges },
      isPublic: saveMindMapForm.isPublic,
    });
  };

  const handleLoadMindMap = (mindMap: MindMap) => {
    if (mindMap.data && typeof mindMap.data === 'object' && 'nodes' in mindMap.data) {
      const mapData = mindMap.data as { nodes: Node[]; edges: Edge[] };
      setNodes(mapData.nodes || []);
      setEdges(mapData.edges || []);
      setSelectedMindMap(mindMap);
      setIsEditing(false);
    }
  };

  const exportMindMap = () => {
    const mindMapData = {
      title: selectedMindMap?.title || saveMindMapForm.title || 'Mind Map',
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(mindMapData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${mindMapData.title.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Mind Map Exported",
      description: "Your mind map has been downloaded as a JSON file.",
    });
  };

  const clearMindMap = () => {
    setNodes([]);
    setEdges([]);
    setSelectedMindMap(null);
    setSaveMindMapForm({ title: "", isPublic: false });
  };

  const nodeTypes = {
    // Custom node types can be added here if needed
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 lg:ml-64">
        <TopBar />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Workflow className="h-8 w-8 text-blue-600" />
              Mind Maps
            </h1>
            <p className="text-gray-600">Create visual concept maps with AI assistance</p>
          </div>

          <Tabs defaultValue="create" className="space-y-6">
            <TabsList>
              <TabsTrigger value="create">Create Mind Map</TabsTrigger>
              <TabsTrigger value="library">My Mind Maps</TabsTrigger>
            </TabsList>

            {/* Create Mind Map Tab */}
            <TabsContent value="create" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Mind Map Generator */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      AI Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Photosynthesis"
                        value={generateForm.topic}
                        onChange={(e) => setGenerateForm(prev => ({ ...prev, topic: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Select 
                        value={generateForm.subject} 
                        onValueChange={(value) => setGenerateForm(prev => ({ ...prev, subject: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBJECTS.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="depth">Depth Levels</Label>
                      <Select 
                        value={generateForm.depth.toString()} 
                        onValueChange={(value) => setGenerateForm(prev => ({ ...prev, depth: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 Levels</SelectItem>
                          <SelectItem value="3">3 Levels</SelectItem>
                          <SelectItem value="4">4 Levels</SelectItem>
                          <SelectItem value="5">5 Levels</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleGenerateMindMap}
                      disabled={generateMindMapMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      {generateMindMapMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate
                        </>
                      )}
                    </Button>

                    {/* Save Mind Map */}
                    {nodes.length > 0 && (
                      <>
                        <hr className="my-4" />
                        <div>
                          <Label htmlFor="title">Mind Map Title</Label>
                          <Input
                            id="title"
                            placeholder="Enter title"
                            value={saveMindMapForm.title}
                            onChange={(e) => setSaveMindMapForm(prev => ({ ...prev, title: e.target.value }))}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={saveMindMapForm.isPublic}
                            onChange={(e) => setSaveMindMapForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="isPublic" className="text-sm">
                            Make public
                          </Label>
                        </div>

                        <div className="space-y-2">
                          <Button
                            onClick={handleSaveMindMap}
                            disabled={saveMindMapMutation.isPending}
                            className="w-full"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Mind Map
                          </Button>
                          
                          <Button variant="outline" onClick={exportMindMap} className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>

                          <Button variant="outline" onClick={clearMindMap} className="w-full">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Mind Map Canvas */}
                <div className="lg:col-span-3">
                  <Card className="h-[600px]">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {selectedMindMap?.title || saveMindMapForm.title || 'Mind Map Canvas'}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          {nodes.length > 0 && (
                            <Badge variant="secondary">
                              {nodes.length} nodes
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[520px]">
                      {nodes.length > 0 ? (
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onConnect={onConnect}
                          nodeTypes={nodeTypes}
                          fitView
                          fitViewOptions={{ padding: 0.1 }}
                        >
                          <Background variant={BackgroundVariant.Dots} />
                          <Controls />
                          <MiniMap 
                            style={{
                              height: 120,
                              width: 200,
                            }}
                            zoomable
                            pannable
                          />
                          <Panel position="top-right">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <ZoomIn className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <ZoomOut className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Maximize className="h-4 w-4" />
                              </Button>
                            </div>
                          </Panel>
                        </ReactFlow>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50">
                          <div className="text-center">
                            <Workflow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mind Map Yet</h3>
                            <p className="text-gray-500 mb-4">Generate an AI mind map or load one from your library</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* My Mind Maps Tab */}
            <TabsContent value="library" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>My Mind Maps</CardTitle>
                    <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {mindMapsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i}>
                          <CardContent className="pt-6">
                            <Skeleton className="h-4 w-3/4 mb-2" />
                            <Skeleton className="h-3 w-1/2 mb-4" />
                            <Skeleton className="h-8 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : mindMaps && mindMaps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mindMaps.map((mindMap) => (
                        <Card key={mindMap.id} className="card-hover">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 line-clamp-2">{mindMap.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">{mindMap.subject}</p>
                              </div>
                              {mindMap.isPublic && (
                                <Badge variant="outline">
                                  <Share2 className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Created</span>
                                <span className="font-medium">
                                  {mindMap.createdAt ? new Date(mindMap.createdAt).toLocaleDateString() : 'Recently'}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Button 
                                className="w-full" 
                                onClick={() => {
                                  handleLoadMindMap(mindMap);
                                  document.querySelector('[value="create"]')?.click();
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Mind Map
                              </Button>
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" size="sm">
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="flex-1" 
                                  size="sm"
                                  onClick={() => {
                                    if (mindMap.data) {
                                      const mapData = mindMap.data as { nodes: Node[]; edges: Edge[] };
                                      setNodes(mapData.nodes || []);
                                      setEdges(mapData.edges || []);
                                      exportMindMap();
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Export
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Workflow className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mind Maps Yet</h3>
                      <p className="text-gray-500 mb-4">Create your first AI-generated mind map to get started</p>
                      <Button onClick={() => document.querySelector('[value="create"]')?.click()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Mind Map
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
