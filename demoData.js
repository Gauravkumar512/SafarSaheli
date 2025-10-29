export const demoUsers = [
  { id: 'u1', name: 'Aisha Khan', email: 'aisha@example.com', password: 'password123', age: 24 },
  { id: 'u2', name: 'Riya Sharma', email: 'riya@example.com', password: 'welcome123', age: 22 },
];

export const demoSafetyPlaces = [
  // Police (2)
  { id: 'p1', name: 'City Police Station', category: 'Police', lat: 28.6139, lng: 77.2090, upvotes: 18, downvotes: 1 },
  { id: 'p2', name: 'Connaught Place Police Booth', category: 'Police', lat: 28.6315, lng: 77.2167, upvotes: 9, downvotes: 0 },

  // Hospitals (3)
  { id: 'p3', name: 'Metro Multi-Speciality Hospital', category: 'Hospital', lat: 28.6331, lng: 77.2205, upvotes: 14, downvotes: 2 },
  { id: 'p4', name: 'City Care Hospital', category: 'Hospital', lat: 28.6181, lng: 77.2045, upvotes: 10, downvotes: 1 },
  { id: 'p5', name: 'St. Mary’s Clinic', category: 'Hospital', lat: 28.6254, lng: 77.2112, upvotes: 7, downvotes: 1 },

  // Hotels (3)
  { id: 'p6', name: 'Sunrise Hotel', category: 'Hotel', lat: 28.6215, lng: 77.2102, upvotes: 12, downvotes: 1 },
  { id: 'p7', name: 'Comfort Inn Central', category: 'Hotel', lat: 28.6289, lng: 77.2071, upvotes: 8, downvotes: 1 },
  { id: 'p8', name: 'Emerald Residency', category: 'Hotel', lat: 28.6372, lng: 77.2155, upvotes: 6, downvotes: 0 },

  // Washrooms - Public (3)
  { id: 'p9', name: 'Public Washroom – Central Park', category: 'Washroom', type: 'Public', lat: 28.6145, lng: 77.2135, upvotes: 22, downvotes: 2 },
  { id: 'p10', name: 'Public Washroom – Rajiv Chowk Gate 5', category: 'Washroom', type: 'Public', lat: 28.6321, lng: 77.2198, upvotes: 13, downvotes: 1 },
  { id: 'p11', name: 'Public Washroom – Patel Chowk Metro', category: 'Washroom', type: 'Public', lat: 28.6263, lng: 77.2142, upvotes: 11, downvotes: 1 },

  // Washrooms - Private (3)
  { id: 'p12', name: 'Private Bathroom – Cafe Hygge', category: 'Washroom', type: 'Private', lat: 28.6187, lng: 77.2051, upvotes: 9, downvotes: 0 },
  { id: 'p13', name: 'Private Bathroom – Mall Restrooms', category: 'Washroom', type: 'Private', lat: 28.6355, lng: 77.2094, upvotes: 12, downvotes: 1 },
  { id: 'p14', name: 'Private Bathroom – Hotel Lobby Access', category: 'Washroom', type: 'Private', lat: 28.6227, lng: 77.2029, upvotes: 7, downvotes: 0 },
];

export const demoLeaderboard = [
  { id: 'u1', name: 'Aisha Khan', points: 2150 },
  { id: 'u2', name: 'Riya Sharma', points: 1780 },
  { id: 'u3', name: 'Meera Patel', points: 1620 },
  { id: 'u4', name: 'Neha Verma', points: 1485 },
  { id: 'u5', name: 'Sanya Gupta', points: 1360 },
  { id: 'u6', name: 'Kritika Rao', points: 1275 },
  { id: 'u7', name: 'Ananya Iyer', points: 1120 },
  { id: 'u8', name: 'Pooja Nair', points: 980 },
  { id: 'u9', name: 'Kushagra Verma', points: 1256 },
  { id: 'u10', name: 'Kushagra Srivastava', points: 1522 },
  { id: 'u11', name: 'Gaurav Kumar', points: 1870 },
  { id: 'u12', name: 'Rashi Aggrawal', points: 1422 },
];

export const demoTrips = [
  { id: 't1', title: 'Jaipur Weekend', destination: 'Jaipur', days: 2, budget: 'Rs 8k–12k', crowd: 'Moderate', rating: 4.6, description: 'Amber Fort, City Palace, Hawa Mahal, local bazaars.' },
  { id: 't2', title: 'Rishikesh Escape', destination: 'Rishikesh', days: 3, budget: 'Rs 10k–15k', crowd: 'Low', rating: 4.4, description: 'Ganga Aarti, rafting, Beatles Ashram, cafes.' },
];

export const categories = ['Hotel', 'Hospital', 'Police', 'Washroom'];
