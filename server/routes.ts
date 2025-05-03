import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  insertProjectSchema,
  insertMoodBoardSchema,
  insertInspirationNodeSchema,
  insertNodeConnectionSchema,
  insertTeamMoodSchema,
  moodTypes,
  nodeTypes,
  tagCategories
} from "@shared/schema";

// Set up multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create multiple paths to ensure the uploads are accessible
      const dirs = [
        path.join(process.cwd(), "public/uploads"),
        path.join(process.cwd(), "dist/public/uploads")
      ];
      
      // Create the directories if they don't exist
      dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      // Store files in the public root directory
      cb(null, dirs[0]);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      const filename = file.fieldname + "-" + uniqueSuffix + ext;
      
      // Log the filename being created
      console.log("Creating file:", filename);
      
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects API
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid project data", errors: result.error });
      }
      
      const project = await storage.createProject(result.data);
      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // MoodBoards API
  app.get("/api/projects/:projectId/moodboards", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const moodBoards = await storage.getMoodBoardsByProject(projectId);
      res.json(moodBoards);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood boards" });
    }
  });

  app.get("/api/moodboards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid mood board ID" });
      }
      
      const moodBoard = await storage.getMoodBoard(id);
      if (!moodBoard) {
        return res.status(404).json({ message: "Mood board not found" });
      }
      
      res.json(moodBoard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood board" });
    }
  });

  app.post("/api/moodboards", async (req: Request, res: Response) => {
    try {
      const result = insertMoodBoardSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid mood board data", errors: result.error });
      }
      
      const moodBoard = await storage.createMoodBoard(result.data);
      res.status(201).json(moodBoard);
    } catch (error) {
      res.status(500).json({ message: "Failed to create mood board" });
    }
  });

  // InspirationNodes API
  app.get("/api/moodboards/:moodBoardId/nodes", async (req: Request, res: Response) => {
    try {
      const moodBoardId = parseInt(req.params.moodBoardId);
      if (isNaN(moodBoardId)) {
        return res.status(400).json({ message: "Invalid mood board ID" });
      }
      
      const nodes = await storage.getInspirationNodesByMoodBoard(moodBoardId);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspiration nodes" });
    }
  });

  app.get("/api/nodes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getInspirationNode(id);
      if (!node) {
        return res.status(404).json({ message: "Inspiration node not found" });
      }
      
      res.json(node);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inspiration node" });
    }
  });

  app.post("/api/nodes", async (req: Request, res: Response) => {
    try {
      // Validate node type
      const nodeSchema = insertInspirationNodeSchema.refine(
        data => nodeTypes.includes(data.type as any),
        { message: "Invalid node type", path: ["type"] }
      ).refine(
        data => moodTypes.includes(data.mood as any),
        { message: "Invalid mood type", path: ["mood"] }
      );
      
      const result = nodeSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid node data", errors: result.error });
      }
      
      const node = await storage.createInspirationNode(result.data);
      res.status(201).json(node);
    } catch (error) {
      res.status(500).json({ message: "Failed to create inspiration node" });
    }
  });

  app.patch("/api/nodes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const node = await storage.getInspirationNode(id);
      if (!node) {
        return res.status(404).json({ message: "Inspiration node not found" });
      }
      
      // Only allow updating certain fields
      const allowedFields = z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        contentUrl: z.string().optional(),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        zIndex: z.number().optional(),
        mood: z.enum(moodTypes as [string, ...string[]]).optional(),
        intensity: z.number().min(0).max(100).optional(),
        tags: z.array(z.string()).optional(),
      });
      
      const result = allowedFields.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid update data", errors: result.error });
      }
      
      const updatedNode = await storage.updateInspirationNode(id, result.data);
      res.json(updatedNode);
    } catch (error) {
      res.status(500).json({ message: "Failed to update inspiration node" });
    }
  });

  app.delete("/api/nodes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid node ID" });
      }
      
      const success = await storage.deleteInspirationNode(id);
      if (!success) {
        return res.status(404).json({ message: "Inspiration node not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete inspiration node" });
    }
  });

  // File Upload API for nodes
  app.post("/api/upload", upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]), (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const response: { [key: string]: string } = {};
      
      console.log("Files received:", files);

      if (files.image && files.image[0]) {
        console.log("Image file:", files.image[0]);
        const uploadedFile = files.image[0];
        const fileName = path.basename(uploadedFile.path);
        const imagePath = `/uploads/${fileName}`;
        
        console.log("File saved to:", uploadedFile.path);
        console.log("File accessible at:", imagePath);
        
        response.imageUrl = imagePath;
      }
      
      if (files.audio && files.audio[0]) {
        const audioPath = `/uploads/${path.basename(files.audio[0].path)}`;
        response.audioUrl = audioPath;
      }
      
      console.log("Sending response:", response);
      res.json(response);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  // Node Connections API
  app.get("/api/moodboards/:moodBoardId/connections", async (req: Request, res: Response) => {
    try {
      const moodBoardId = parseInt(req.params.moodBoardId);
      if (isNaN(moodBoardId)) {
        return res.status(400).json({ message: "Invalid mood board ID" });
      }
      
      const connections = await storage.getNodeConnections(moodBoardId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch node connections" });
    }
  });

  app.post("/api/connections", async (req: Request, res: Response) => {
    try {
      const result = insertNodeConnectionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid connection data", errors: result.error });
      }
      
      const connection = await storage.createNodeConnection(result.data);
      res.status(201).json(connection);
    } catch (error) {
      res.status(500).json({ message: "Failed to create node connection" });
    }
  });

  app.delete("/api/connections/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid connection ID" });
      }
      
      const success = await storage.deleteNodeConnection(id);
      if (!success) {
        return res.status(404).json({ message: "Connection not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete connection" });
    }
  });

  // Team Moods API
  app.get("/api/projects/:projectId/moods", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const moods = await storage.getTeamMoods(projectId);
      res.json(moods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team moods" });
    }
  });

  app.get("/api/projects/:projectId/mood-summary", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const summary = await storage.getTeamMoodSummary(projectId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood summary" });
    }
  });

  app.post("/api/moods", async (req: Request, res: Response) => {
    try {
      const moodSchema = insertTeamMoodSchema.refine(
        data => moodTypes.includes(data.mood as any),
        { message: "Invalid mood type", path: ["mood"] }
      );
      
      const result = moodSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid mood data", errors: result.error });
      }
      
      const mood = await storage.createTeamMood(result.data);
      res.status(201).json(mood);
    } catch (error) {
      res.status(500).json({ message: "Failed to create team mood" });
    }
  });

  // Utility endpoints
  app.get("/api/mood-types", async (req: Request, res: Response) => {
    res.json(moodTypes);
  });

  app.get("/api/node-types", async (req: Request, res: Response) => {
    res.json(nodeTypes);
  });

  app.get("/api/tag-categories", async (req: Request, res: Response) => {
    res.json(tagCategories);
  });
  
  // User API endpoints
  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
