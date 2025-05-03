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
