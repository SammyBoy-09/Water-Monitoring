// Sample educational content for testing
export const sampleEducationalContent = [
  {
    id: "content_1",
    title: "Water Safety Basics",
    description: "Learn the fundamental principles of water safety and contamination prevention.",
    category: "water_safety",
    type: "article",
    difficultyLevel: "beginner",
    content: `
      <h2>Understanding Water Safety</h2>
      <p>Water safety is crucial for preventing waterborne diseases and ensuring community health.</p>
      <h3>Key Points:</h3>
      <ul>
        <li>Always use clean, treated water for drinking</li>
        <li>Store water in clean, covered containers</li>
        <li>Boil water for at least 1 minute if you're unsure about its safety</li>
        <li>Keep water sources away from contamination</li>
      </ul>
      <p>Remember: Prevention is better than cure when it comes to water safety.</p>
    `,
    thumbnailUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
    mediaUrl: "",
    tags: ["water safety", "health", "prevention", "basics"],
    estimatedReadTime: 5,
    language: "en",
    author: "Water Safety Expert",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    viewCount: 245,
    bookmarkCount: 23,
    learningObjectives: [
      "Understand basic water safety principles",
      "Learn how to identify safe water sources",
      "Know proper water storage techniques"
    ],
    prerequisites: [],
    isPublished: true,
    isFeatured: true
  },
  {
    id: "content_2",
    title: "Emergency Water Purification",
    description: "Step-by-step guide to purifying water during emergencies.",
    category: "emergency_response",
    type: "step_by_step",
    difficultyLevel: "intermediate",
    content: `
      <h2>Emergency Water Purification Methods</h2>
      <h3>Method 1: Boiling</h3>
      <ol>
        <li>Collect water in a clean container</li>
        <li>Bring water to a rolling boil</li>
        <li>Boil for at least 1 minute (3 minutes at high altitude)</li>
        <li>Let cool before drinking</li>
      </ol>
      <h3>Method 2: Water Purification Tablets</h3>
      <ol>
        <li>Add the recommended number of tablets to water</li>
        <li>Wait 30 minutes before drinking</li>
        <li>If water is very cold, wait longer</li>
      </ol>
    `,
    thumbnailUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=300&fit=crop",
    tags: ["emergency", "purification", "survival", "boiling"],
    estimatedReadTime: 8,
    language: "en",
    author: "Emergency Response Team",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
    viewCount: 189,
    bookmarkCount: 34,
    learningObjectives: [
      "Master emergency water purification techniques",
      "Understand when different methods are appropriate",
      "Learn to assess water quality in emergency situations"
    ],
    prerequisites: ["Basic water safety knowledge"],
    isPublished: true,
    isFeatured: false
  },
  {
    id: "content_3",
    title: "Waterborne Disease Prevention",
    description: "Comprehensive guide to preventing waterborne diseases in communities.",
    category: "disease_prevention",
    type: "image_guide",
    difficultyLevel: "beginner",
    content: `
      <h2>Preventing Waterborne Diseases</h2>
      <p>Waterborne diseases like cholera, typhoid, and diarrhea can be prevented with proper hygiene and water treatment.</p>
      <h3>Prevention Strategies:</h3>
      <ul>
        <li>Use only safe drinking water</li>
        <li>Practice good hand hygiene</li>
        <li>Properly dispose of waste</li>
        <li>Maintain clean food preparation areas</li>
      </ul>
    `,
    thumbnailUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop",
    mediaUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop",
    tags: ["disease prevention", "hygiene", "health", "community"],
    estimatedReadTime: 6,
    language: "en",
    author: "Public Health Department",
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
    viewCount: 312,
    bookmarkCount: 45,
    learningObjectives: [
      "Identify common waterborne diseases",
      "Implement prevention strategies",
      "Recognize symptoms and when to seek help"
    ],
    prerequisites: [],
    isPublished: true,
    isFeatured: true
  },
  {
    id: "content_4",
    title: "Water Quality Testing Guide",
    description: "Learn how to test water quality using simple methods and test kits.",
    category: "health_monitoring",
    type: "video",
    difficultyLevel: "intermediate",
    content: `
      <h2>Testing Water Quality</h2>
      <p>Regular water testing is essential for ensuring safe drinking water.</p>
      <h3>Testing Methods:</h3>
      <ul>
        <li>Visual inspection for color and clarity</li>
        <li>Smell test for unusual odors</li>
        <li>pH testing using test strips</li>
        <li>Bacterial testing with test kits</li>
      </ul>
    `,
    thumbnailUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=400&h=300&fit=crop",
    mediaUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4",
    tags: ["testing", "quality", "monitoring", "health"],
    estimatedReadTime: 10,
    duration: 180, // 3 minutes
    language: "en",
    author: "Water Quality Specialist",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    viewCount: 156,
    bookmarkCount: 28,
    learningObjectives: [
      "Learn basic water testing methods",
      "Understand when professional testing is needed",
      "Interpret test results correctly"
    ],
    prerequisites: ["Basic understanding of water contamination"],
    isPublished: true,
    isFeatured: false
  },
  {
    id: "content_5",
    title: "Hygiene Practices Checklist",
    description: "Daily hygiene checklist to prevent water-related illnesses.",
    category: "hygiene_practices",
    type: "checklist",
    difficultyLevel: "beginner",
    content: `
Daily Hygiene Checklist:
☐ Wash hands with soap and clean water before eating
☐ Wash hands after using the toilet
☐ Use boiled or treated water for drinking
☐ Cover water containers to prevent contamination
☐ Clean cooking utensils with safe water
☐ Dispose of waste properly
☐ Keep food covered and protected
☐ Maintain clean living environment
    `,
    thumbnailUrl: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=400&h=300&fit=crop",
    tags: ["hygiene", "checklist", "daily routine", "prevention"],
    estimatedReadTime: 3,
    language: "en",
    author: "Health Education Team",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
    viewCount: 428,
    bookmarkCount: 67,
    learningObjectives: [
      "Establish daily hygiene routines",
      "Remember key prevention practices",
      "Maintain consistent health habits"
    ],
    prerequisites: [],
    isPublished: true,
    isFeatured: false
  }
];