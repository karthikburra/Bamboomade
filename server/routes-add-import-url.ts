// This file contains the code to add to your routes.ts file
// Add this route near the other API endpoints

// URL Importer API endpoint
app.post("/api/import-url", async (req, res) => {
  try {
    // Check if user is admin or logged in
    if (!req.session.userId && !req.session.adminUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    // Use the admin user ID or regular user ID
    const userId = req.session.adminUser ? (req.session.adminUser.id || 1) : (req.session.userId || 1);
    
    // Import content from the URL using our importer
    const result = await importFromUrl(url, userId);
    
    return res.status(200).json({ 
      message: "Content imported successfully", 
      data: result 
    });
  } catch (error) {
    console.error("Error importing URL:", error);
    return res.status(500).json({ 
      message: "Failed to import content",
      error: error.message 
    });
  }
});