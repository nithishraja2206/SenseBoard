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
    // Create sample projects
    const project1: Project = {
      id: this.projectIdCounter++,
      name: "Wellness App Redesign",
      description: "A complete redesign of the meditation and wellness app focusing on a more intuitive and calming user experience.",
      coverImageUrl: "",
      createdAt: new Date("2023-09-15"),
      updatedAt: new Date("2023-09-15")
    };
    
    const project2: Project = {
      id: this.projectIdCounter++,
      name: "Travel Platform",
      description: "Concept design for a next-generation travel booking platform with immersive experience previews.",
      coverImageUrl: "",
      createdAt: new Date("2023-10-05"),
      updatedAt: new Date("2023-10-05")
    };
    
    const project3: Project = {
      id: this.projectIdCounter++,
      name: "Smart Home Dashboard",
      description: "A central hub interface for controlling all connected home devices with ambient awareness features.",
      coverImageUrl: "",
      createdAt: new Date("2023-11-20"),
      updatedAt: new Date("2023-11-20")
    };
    
    this.projects.set(project1.id, project1);
    this.projects.set(project2.id, project2);
    this.projects.set(project3.id, project3);
    
    // Create sample mood boards
    const moodBoard1: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project1.id,
      name: "Visual Inspirations",
      description: "Color schemes, typography, and visual elements for the wellness app redesign",
      createdAt: new Date("2023-09-16"),
      updatedAt: new Date("2023-09-16")
    };
    
    const moodBoard2: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project1.id,
      name: "User Flow Concepts",
      description: "Different approaches to the user journey and navigation patterns",
      createdAt: new Date("2023-09-18"),
      updatedAt: new Date("2023-09-18")
    };
    
    const moodBoard3: MoodBoard = {
      id: this.moodBoardIdCounter++,
      projectId: project2.id,
      name: "Destination Experiences",
      description: "Visual and sensory inspirations for how destinations should be presented",
      createdAt: new Date("2023-10-10"),
      updatedAt: new Date("2023-10-10")
    };
    
    this.moodBoards.set(moodBoard1.id, moodBoard1);
    this.moodBoards.set(moodBoard2.id, moodBoard2);
    this.moodBoards.set(moodBoard3.id, moodBoard3);
    
    // Create some sample nodes for the first mood board
    const node1: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "image",
      title: "Color Palette Inspiration",
      description: "Soft blues and purples for calming effect",
      content: JSON.stringify({
        imageUrl: "https://via.placeholder.com/300x200/7B68EE/FFFFFF?text=Color+Palette"
      }),
      positionX: 100,
      positionY: 150,
      width: 320,
      height: 240,
      zIndex: 1,
      mood: "calm",
      intensity: 70,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node2: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "thought",
      title: "User Experience Goal",
      description: "The app should feel like a natural extension of the user's mental state - responding to their needs before they even realize what they need.",
      content: JSON.stringify({
        source: "Team brainstorming",
        date: "2023-09-17"
      }),
      positionX: 450,
      positionY: 200,
      width: 320,
      height: 200,
      zIndex: 1,
      mood: "focused",
      intensity: 85,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const node3: InspirationNode = {
      id: this.nodeIdCounter++,
      moodBoardId: moodBoard1.id,
      type: "sketch",
      title: "Navigation Concept",
      description: "Fluid, gesture-based navigation that feels intuitive and responsive",
      content: JSON.stringify({
        paths: "<svg>...</svg>" // Simplified for example
      }),
      positionX: 200,
      positionY: 400,
      width: 350,
      height: 300,
      zIndex: 1,
      mood: "energetic",
      intensity: 60,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.inspirationNodes.set(node1.id, node1);
    this.inspirationNodes.set(node2.id, node2);
    this.inspirationNodes.set(node3.id, node3);
    
    // Create some connections between nodes
    const connection1: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node1.id,
      targetNodeId: node2.id,
      strength: 75,
      createdAt: new Date()
    };
    
    const connection2: NodeConnection = {
      id: this.connectionIdCounter++,
      sourceNodeId: node2.id,
      targetNodeId: node3.id,
      strength: 90,
      createdAt: new Date()
    };
    
    this.nodeConnections.set(connection1.id, connection1);
    this.nodeConnections.set(connection2.id, connection2);
    
    // Add some team moods
    const mood1: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project1.id,
      userId: 1, // Default user
      mood: "calm",
      intensity: 80,
      createdAt: new Date()
    };
    
    const mood2: TeamMood = {
      id: this.teamMoodIdCounter++,
      projectId: project1.id,
      userId: 2, // Another user
      mood: "focused",
      intensity: 90,
      createdAt: new Date()
    };
    
    this.teamMoods.set(mood1.id, mood1);
    this.teamMoods.set(mood2.id, mood2);
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
    const user: User = { ...insertUser, id };
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
