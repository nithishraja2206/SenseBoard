import {
  User, InsertUser, users,
  Project, InsertProject, projects,
  MoodBoard, InsertMoodBoard, moodBoards,
  InspirationNode, InsertInspirationNode, inspirationNodes,
  NodeConnection, InsertNodeConnection, nodeConnections,
  TeamMood, InsertTeamMood, teamMoods
} from "@shared/schema";

// Modify the interface with CRUD methods for SenseBoard app
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // MoodBoard methods
  getMoodBoard(id: number): Promise<MoodBoard | undefined>;
  getMoodBoardsByProject(projectId: number): Promise<MoodBoard[]>;
  createMoodBoard(moodBoard: InsertMoodBoard): Promise<MoodBoard>;
  updateMoodBoard(id: number, moodBoard: Partial<MoodBoard>): Promise<MoodBoard | undefined>;
  deleteMoodBoard(id: number): Promise<boolean>;
  
  // InspirationNode methods
  getInspirationNode(id: number): Promise<InspirationNode | undefined>;
  getInspirationNodesByMoodBoard(moodBoardId: number): Promise<InspirationNode[]>;
  createInspirationNode(node: InsertInspirationNode): Promise<InspirationNode>;
  updateInspirationNode(id: number, node: Partial<InspirationNode>): Promise<InspirationNode | undefined>;
  deleteInspirationNode(id: number): Promise<boolean>;
  
  // NodeConnection methods
  getNodeConnections(moodBoardId: number): Promise<NodeConnection[]>;
  createNodeConnection(connection: InsertNodeConnection): Promise<NodeConnection>;
  deleteNodeConnection(id: number): Promise<boolean>;
  
  // TeamMood methods
  getTeamMoods(projectId: number): Promise<TeamMood[]>;
  createTeamMood(teamMood: InsertTeamMood): Promise<TeamMood>;
  getTeamMoodSummary(projectId: number): Promise<Record<string, { count: number, intensity: number }>>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private moodBoards: Map<number, MoodBoard>;
  private inspirationNodes: Map<number, InspirationNode>;
  private nodeConnections: Map<number, NodeConnection>;
  private teamMoods: Map<number, TeamMood>;
  
  // ID counters
  private userIdCounter: number;
  private projectIdCounter: number;
  private moodBoardIdCounter: number;
  private nodeIdCounter: number;
  private connectionIdCounter: number;
  private teamMoodIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.moodBoards = new Map();
    this.inspirationNodes = new Map();
    this.nodeConnections = new Map();
    this.teamMoods = new Map();
    
    this.userIdCounter = 1;
    this.projectIdCounter = 1;
    this.moodBoardIdCounter = 1;
    this.nodeIdCounter = 1;
    this.connectionIdCounter = 1;
    this.teamMoodIdCounter = 1;
    
    // Add sample data
    this.initSampleData();
  }
  
  // Initialize sample data for demonstration
  private initSampleData() {
    // Create sample user
    const user1: User = {
      id: this.userIdCounter++,
      username: "designlead",
      password: "password123",
      name: "Alex Johnson",
      email: "alex.johnson@example.com",
      role: "Creative Director",
      avatarUrl: null,
      biography: "Experienced creative director with 8+ years in UX/UI design focused on wellness and travel applications.",
      createdAt: new Date("2023-01-15"),
      updatedAt: new Date("2023-01-15")
    };
    
    this.users.set(user1.id, user1);
    
    // Create sample projects
    const project1: Project = {
      id: this.projectIdCounter++,
      name: "Serenity Wellness App",
      description: "A complete redesign of the meditation and wellness app focusing on a more intuitive and calming user experience, with innovative sensory feedback.",
      coverImageUrl: "",
      createdAt: new Date("2023-09-15"),
      updatedAt: new Date("2023-09-15")
    };
    
    const project2: Project = {
      id: this.projectIdCounter++,
      name: "Immersive Travel Platform",
      description: "Next-generation travel platform with multi-sensory destination previews that engage sight, sound, and emotional connection.",
      coverImageUrl: "",
      createdAt: new Date("2023-10-05"),
      updatedAt: new Date("2023-10-05")
    };
    
    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    
    // Create sample mood boards for Project 1
    const moodBoard1: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project1.id,
      name: "Visual Language & Color Theory",
      description: "Exploring color psychology, typography, and visual elements for inducing calmness and focus",
      createdAt: new Date("2023-09-16"),
      updatedAt: new Date("2023-09-16")
    };
    
    const moodBoard2: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project1.id,
      name: "Interaction & Flow Patterns",
      description: "Gesture-based navigation concepts and fluid transitions between meditation states",
      createdAt: new Date("2023-09-18"),
      updatedAt: new Date("2023-09-18")
    };
    
    // Create sample mood boards for Project 2
    const moodBoard3: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project2.id,
      name: "Destination Sensory Palette",
      description: "Multi-sensory elements capturing the essence of travel destinations through color, sound, and texture",
      createdAt: new Date("2023-10-10"),
      updatedAt: new Date("2023-10-10")
    };
    
    const moodBoard4: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project2.id,
      name: "Ambient User Interface Elements",
      description: "Non-intrusive UI components that adapt to user mood and destination context",
      createdAt: new Date("2023-10-12"),
      updatedAt: new Date("2023-10-12")
    };
    
    this.moodBoards.set(moodBoard1.id, moodBoard1);
    this.moodBoards.set(moodBoard2.id, moodBoard2);
    this.moodBoards.set(moodBoard3.id, moodBoard3);
    this.moodBoards.set(moodBoard4.id, moodBoard4);
    
    // Create sample nodes for the "Visual Language & Color Theory" mood board
    const node1: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "image",
      title: "Calming Color Palette",
      description: "Soft blues, lavenders, and gentle greens that research shows reduce anxiety and promote mindfulness",
      content: "{}",
      contentUrl: "https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=600&h=400",
      positionX: 100,
      positionY: 150,
      width: 320,
      height: 240,
      zIndex: 1,
      mood: "calm",
      intensity: 75,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node2: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "thought",
      title: "Core Design Philosophy",
      description: "The app should function as a 'mood responsive environment' - subtly shifting its appearance and behavior based on the user's detected emotional state",
      content: JSON.stringify({
        source: "Stakeholder workshop",
        date: "2023-09-17"
      }),
      contentUrl: null, // Added to match schema
      positionX: 450,
      positionY: 200,
      width: 320,
      height: 220,
      zIndex: 1,
      mood: "focused",
      intensity: 85,
      tags: ["UX Flow", "Intent"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node3: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "sketch",
      title: "Typography Scale & Rhythm",
      description: "Typeface progression showing the relationship between content importance and visual weight - Space Grotesk for headings, Inter for body text",
      content: JSON.stringify({
        paths: "<svg viewBox='0 0 400 300'><text x='20' y='50' font-family='Space Grotesk' font-size='28px'>Primary Heading</text><text x='20' y='100' font-family='Space Grotesk' font-size='22px'>Secondary Heading</text><text x='20' y='150' font-family='Inter' font-size='16px'>Body text that flows naturally and maintains readability</text><text x='20' y='200' font-family='Inter' font-size='14px'>Smaller details and supporting information</text><text x='20' y='250' font-family='Inter' font-size='12px'>Fine print and metadata</text></svg>"
      }),
      contentUrl: null, // Added to match schema
      positionX: 200,
      positionY: 400,
      width: 400,
      height: 300,
      zIndex: 1,
      mood: "energetic",
      intensity: 60,
      tags: ["Visual"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create sample nodes for the "Interaction & Flow Patterns" mood board
    const node4: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard2.id,
      type: "image",
      title: "Gesture Mapping Reference",
      description: "Comprehensive set of finger movements that correspond to different meditation actions",
      content: "{}",
      contentUrl: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=400&h=300",
      positionX: 150,
      positionY: 180,
      width: 400,
      height: 300,
      zIndex: 1,
      mood: "focused",
      intensity: 80,
      tags: ["UX Flow"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node5: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard2.id,
      type: "sketch",
      title: "Breathing Exercise Animation",
      description: "Animation concept for guiding breathing - expanding circle with soft glow effect that signals inhale/exhale timing",
      content: JSON.stringify({
        paths: "<svg viewBox='0 0 400 400'><circle cx='200' cy='200' r='100' fill='none' stroke='#7B68EE' stroke-width='3' /><circle cx='200' cy='200' r='150' fill='none' stroke='#7B68EE' stroke-width='2' stroke-opacity='0.6' /><circle cx='200' cy='200' r='180' fill='none' stroke='#7B68EE' stroke-width='1' stroke-opacity='0.3' /></svg>"
      }),
      contentUrl: null, // Added to match schema
      positionX: 350,
      positionY: 220,
      width: 400,
      height: 400,
      zIndex: 1,
      mood: "calm",
      intensity: 90,
      tags: ["Visual", "Ambient"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node6: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard2.id,
      type: "audio",
      title: "Ambient Sound Concept",
      description: "Low-frequency tones that synchronize with breathing exercise and adjust in timbre based on user's stress level",
      content: JSON.stringify({
        duration: 45,
        waveform: "sine"
      }),
      contentUrl: null, // Added to match schema
      positionX: 550,
      positionY: 320,
      width: 320,
      height: 180,
      zIndex: 1,
      mood: "calm",
      intensity: 85,
      tags: ["Ambient"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create sample nodes for "Destination Sensory Palette" mood board
    const node7: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard3.id,
      type: "image",
      title: "Kyoto Garden Color Analysis",
      description: "Color extraction from traditional Japanese gardens showing how natural elements can be translated into UI components",
      content: "{}",
      contentUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&h=400",
      positionX: 120,
      positionY: 150,
      width: 400,
      height: 300,
      zIndex: 1,
      mood: "calm",
      intensity: 95,
      tags: ["Visual"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node8: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard3.id,
      type: "audio",
      title: "Barcelona Street Ambience",
      description: "Audio capture of Las Ramblas with distinctive crowd energy and architectural acoustics",
      content: JSON.stringify({
        duration: 120,
        waveform: "complex"
      }),
      contentUrl: null, // Added to match schema
      positionX: 550,
      positionY: 180,
      width: 300,
      height: 180,
      zIndex: 1,
      mood: "energetic",
      intensity: 85,
      tags: ["Ambient"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node9: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard3.id,
      type: "thought",
      title: "Sensory Translation Theory",
      description: "How do we effectively translate the feeling of 'being there' into digital interfaces? Each destination has unique sensory signatures that can be abstracted into UI patterns.",
      content: JSON.stringify({
        source: "Research paper by Dr. Sarah Chen, MIT Media Lab",
        date: "2023-08-05"
      }),
      contentUrl: null, // Added to match schema
      positionX: 350,
      positionY: 400,
      width: 380,
      height: 220,
      zIndex: 1,
      mood: "focused",
      intensity: 90,
      tags: ["Intent"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Create sample nodes for "Ambient User Interface Elements" mood board
    const node10: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard4.id,
      type: "sketch",
      title: "Contextual Navigation Concept",
      description: "UI elements that morph based on destination context - showing how the same functional elements adapt their appearance",
      content: JSON.stringify({
        paths: "<svg viewBox='0 0 500 300'><rect x='50' y='50' width='400' height='60' rx='30' fill='rgba(74, 144, 226, 0.2)' stroke='#4A90E2' /><rect x='50' y='130' width='400' height='60' rx='30' fill='rgba(240, 140, 50, 0.2)' stroke='#F08C32' /><rect x='50' y='210' width='400' height='60' rx='5' fill='rgba(46, 204, 113, 0.2)' stroke='#2ECC71' /></svg>"
      }),
      contentUrl: null, // Added to match schema
      positionX: 180,
      positionY: 150,
      width: 500,
      height: 300,
      zIndex: 1,
      mood: "energetic",
      intensity: 75,
      tags: ["Visual", "UX Flow"],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add all the inspiration nodes to the storage
    this.inspirationNodes.set(node1.id, node1);
    this.inspirationNodes.set(node2.id, node2);
    this.inspirationNodes.set(node3.id, node3);
    this.inspirationNodes.set(node4.id, node4);
    this.inspirationNodes.set(node5.id, node5);
    this.inspirationNodes.set(node6.id, node6);
    this.inspirationNodes.set(node7.id, node7);
    this.inspirationNodes.set(node8.id, node8);
    this.inspirationNodes.set(node9.id, node9);
    this.inspirationNodes.set(node10.id, node10);
    
    // Create connections between nodes in the same mood board
    // Visual Language mood board connections
    const connection1: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node1.id,
      targetNodeId: node2.id,
      strength: 85,
      createdAt: new Date()
    };
    
    const connection2: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node2.id,
      targetNodeId: node3.id,
      strength: 90,
      createdAt: new Date()
    };
    
    const connection3: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node1.id,
      targetNodeId: node3.id,
      strength: 70,
      createdAt: new Date()
    };
    
    // Interaction & Flow mood board connections
    const connection4: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node4.id,
      targetNodeId: node5.id,
      strength: 80,
      createdAt: new Date()
    };
    
    const connection5: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node5.id,
      targetNodeId: node6.id,
      strength: 95,
      createdAt: new Date()
    };
    
    // Destination Sensory Palette mood board connections
    const connection6: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node7.id,
      targetNodeId: node9.id,
      strength: 85,
      createdAt: new Date()
    };
    
    const connection7: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node8.id,
      targetNodeId: node9.id,
      strength: 80,
      createdAt: new Date()
    };
    
    // Add all connections to storage
    this.nodeConnections.set(connection1.id, connection1);
    this.nodeConnections.set(connection2.id, connection2);
    this.nodeConnections.set(connection3.id, connection3);
    this.nodeConnections.set(connection4.id, connection4);
    this.nodeConnections.set(connection5.id, connection5);
    this.nodeConnections.set(connection6.id, connection6);
    this.nodeConnections.set(connection7.id, connection7);
    
    // Add team moods for both projects
    // Serenity Wellness App team moods
    const mood1: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project1.id,
      userId: 1, // Alex
      mood: "calm",
      intensity: 80,
      createdAt: new Date()
    };
    
    const mood2: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project1.id,
      userId: 2, // Jamie
      mood: "focused",
      intensity: 90,
      createdAt: new Date()
    };
    
    const mood3: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project1.id,
      userId: 3, // Morgan
      mood: "calm",
      intensity: 75,
      createdAt: new Date()
    };
    
    // Immersive Travel Platform team moods
    const mood4: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project2.id,
      userId: 1, // Alex
      mood: "energetic",
      intensity: 85,
      createdAt: new Date()
    };
    
    const mood5: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project2.id,
      userId: 2, // Jamie
      mood: "energetic",
      intensity: 90,
      createdAt: new Date()
    };
    
    const mood6: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project2.id,
      userId: 4, // Taylor
      mood: "playful",
      intensity: 95,
      createdAt: new Date()
    };
    
    // Add all moods to storage
    this.teamMoods.set(mood1.id, mood1);
    this.teamMoods.set(mood2.id, mood2);
    this.teamMoods.set(mood3.id, mood3);
    this.teamMoods.set(mood4.id, mood4);
    this.teamMoods.set(mood5.id, mood5);
    this.teamMoods.set(mood6.id, mood6);
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      updatedAt: now,
      avatarUrl: null,
      biography: null
    };
    this.users.set(id, user);
    return user;
  }
  
  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.projectIdCounter++;
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: number, projectUpdate: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;
    
    const updatedProject: Project = {
      ...project,
      ...projectUpdate,
      id,
      updatedAt: new Date()
    };
    
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // MoodBoard methods
  async getMoodBoard(id: number): Promise<MoodBoard | undefined> {
    return this.moodBoards.get(id);
  }
  
  async getMoodBoardsByProject(projectId: number): Promise<MoodBoard[]> {
    return Array.from(this.moodBoards.values()).filter(
      (board) => board.projectId === projectId
    );
  }
  
  async createMoodBoard(insertMoodBoard: InsertMoodBoard): Promise<MoodBoard> {
    const id = this.moodBoardIdCounter++;
    const now = new Date();
    const moodBoard: MoodBoard = {
      ...insertMoodBoard,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.moodBoards.set(id, moodBoard);
    return moodBoard;
  }
  
  async updateMoodBoard(id: number, moodBoardUpdate: Partial<MoodBoard>): Promise<MoodBoard | undefined> {
    const moodBoard = this.moodBoards.get(id);
    if (!moodBoard) return undefined;
    
    const updatedMoodBoard: MoodBoard = {
      ...moodBoard,
      ...moodBoardUpdate,
      id,
      updatedAt: new Date()
    };
    
    this.moodBoards.set(id, updatedMoodBoard);
    return updatedMoodBoard;
  }
  
  async deleteMoodBoard(id: number): Promise<boolean> {
    return this.moodBoards.delete(id);
  }
  
  // InspirationNode methods
  async getInspirationNode(id: number): Promise<InspirationNode | undefined> {
    return this.inspirationNodes.get(id);
  }
  
  async getInspirationNodesByMoodBoard(moodBoardId: number): Promise<InspirationNode[]> {
    return Array.from(this.inspirationNodes.values()).filter(
      (node) => node.moodBoardId === moodBoardId
    );
  }
  
  async createInspirationNode(insertNode: InsertInspirationNode): Promise<InspirationNode> {
    const id = this.nodeIdCounter++;
    const now = new Date();
    const node: InspirationNode = {
      ...insertNode,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.inspirationNodes.set(id, node);
    return node;
  }
  
  async updateInspirationNode(id: number, nodeUpdate: Partial<InspirationNode>): Promise<InspirationNode | undefined> {
    const node = this.inspirationNodes.get(id);
    if (!node) return undefined;
    
    const updatedNode: InspirationNode = {
      ...node,
      ...nodeUpdate,
      id,
      updatedAt: new Date()
    };
    
    this.inspirationNodes.set(id, updatedNode);
    return updatedNode;
  }
  
  async deleteInspirationNode(id: number): Promise<boolean> {
    return this.inspirationNodes.delete(id);
  }
  
  // NodeConnection methods
  async getNodeConnections(moodBoardId: number): Promise<NodeConnection[]> {
    const moodBoardNodes = await this.getInspirationNodesByMoodBoard(moodBoardId);
    const moodBoardNodeIds = moodBoardNodes.map(node => node.id);
    
    return Array.from(this.nodeConnections.values()).filter(
      connection => 
        moodBoardNodeIds.includes(connection.sourceNodeId) && 
        moodBoardNodeIds.includes(connection.targetNodeId)
    );
  }
  
  async createNodeConnection(insertConnection: InsertNodeConnection): Promise<NodeConnection> {
    const id = this.connectionIdCounter++;
    const now = new Date();
    const connection: NodeConnection = {
      ...insertConnection,
      id,
      createdAt: now
    };
    this.nodeConnections.set(id, connection);
    return connection;
  }
  
  async deleteNodeConnection(id: number): Promise<boolean> {
    return this.nodeConnections.delete(id);
  }
  
  // TeamMood methods
  async getTeamMoods(projectId: number): Promise<TeamMood[]> {
    return Array.from(this.teamMoods.values()).filter(
      (mood) => mood.projectId === projectId
    );
  }
  
  async createTeamMood(insertTeamMood: InsertTeamMood): Promise<TeamMood> {
    const id = this.teamMoodIdCounter++;
    const now = new Date();
    const teamMood: TeamMood = {
      ...insertTeamMood,
      id,
      createdAt: now
    };
    this.teamMoods.set(id, teamMood);
    return teamMood;
  }
  
  async getTeamMoodSummary(projectId: number): Promise<Record<string, { count: number, intensity: number }>> {
    const teamMoods = await this.getTeamMoods(projectId);
    const summary: Record<string, { count: number, intensity: number, total: number }> = {};
    
    teamMoods.forEach(mood => {
      if (!summary[mood.mood]) {
        summary[mood.mood] = { count: 0, intensity: 0, total: 0 };
      }
      
      summary[mood.mood].count += 1;
      summary[mood.mood].total += mood.intensity;
    });
    
    // Calculate average intensity
    Object.keys(summary).forEach(mood => {
      summary[mood].intensity = Math.round(summary[mood].total / summary[mood].count);
      delete summary[mood].total;
    });
    
    return summary;
  }
}

export const storage = new MemStorage();
