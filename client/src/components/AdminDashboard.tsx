import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addAiTrainingData } from "@/lib/bamboo-ai";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface TrainingData {
  id: number;
  question: string;
  answer: string;
  category: string;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("training");
  
  // Training form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("");
  
  // Fetch training data
  const { data: trainingData, isLoading: isLoadingTraining } = useQuery<TrainingData[]>({
    queryKey: ["/api/admin/training-data"],
    enabled: activeTab === "training",
  });
  
  // Add training data mutation
  const { mutate: addTrainingData, isPending: isAddingTraining } = useMutation({
    mutationFn: async (data: { question: string; answer: string; category: string }) => {
      await addAiTrainingData(data.question, data.answer, data.category);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Training data added successfully",
      });
      setQuestion("");
      setAnswer("");
      setCategory("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/training-data"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add training data",
        variant: "destructive",
      });
      console.error("Add training data error:", error);
    },
  });
  
  const handleSubmitTraining = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !answer || !category) {
      toast({
        title: "Validation Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }
    
    addTrainingData({ question, answer, category });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>BambooMade Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="training">AI Training</TabsTrigger>
              <TabsTrigger value="sessions">Counseling Sessions</TabsTrigger>
              <TabsTrigger value="users">User Management</TabsTrigger>
            </TabsList>
            
            <TabsContent value="training" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Add Training Data Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Add Training Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitTraining} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="question">Question</Label>
                        <Input
                          id="question"
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          placeholder="What are the benefits of bamboo as a building material?"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                          id="answer"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          placeholder="Bamboo is sustainable, renewable, and has high tensile strength..."
                          rows={5}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="materials">Materials</SelectItem>
                            <SelectItem value="techniques">Techniques</SelectItem>
                            <SelectItem value="sustainability">Sustainability</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="workshops">Workshops</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isAddingTraining}
                      >
                        {isAddingTraining ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Training Data"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                {/* Existing Training Data */}
                <Card>
                  <CardHeader>
                    <CardTitle>Existing Training Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTraining ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {trainingData?.map((item) => (
                          <Card key={item.id} className="p-4 space-y-2 border-l-4 border-l-primary-500">
                            <div>
                              <span className="text-xs font-medium bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                                {item.category}
                              </span>
                              <p className="font-medium mt-2">{item.question}</p>
                              <p className="text-sm text-muted-foreground mt-1">{item.answer}</p>
                            </div>
                          </Card>
                        ))}
                        
                        {trainingData?.length === 0 && (
                          <p className="text-center text-muted-foreground py-8">
                            No training data available
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="sessions">
              <Card>
                <CardHeader>
                  <CardTitle>Counseling Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Session management features coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    User management features coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
