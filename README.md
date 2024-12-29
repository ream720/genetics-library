# React + TypeScript + Vite

## Profile Page with Seeds and Clones Management

This project is a web application that allows users to manage their seed and clone collections. Users can view and search for other users based on profile, seed/clone collections, and manage detailed information about their seed/clone collections.

# Features

1. User Profile
   Displays the user’s profile information, including:

- Username
- Profile picture (WIP)
- Accepted payment methods

2. Seeds Collection
   Users can manage their seed collections with details such as:

- Strain name
- Breeder
- Number of seeds
- Feminization status (indicated by the ♀ icon)
- Availability status (with success or error icons)
- Additional tags like "Open Pack"
- Date the seeds were added

3. Clones Collection
   Users can manage their clone collections with details including:

- Strain name
- Breeder
- Cut name and generation
- Sex of the clone (indicated by a small label)
- Availability status (with success or error icons)
- Additional tags like "Breeder Cut"
- Date the clones were added

# Technologies Used

## Frontend

- React with TypeScript
- Material UI for styling
- React Router for navigation

## Backend

- Firebase Firestore for database
- Firebase Authentication for user management

## Icons and Components

- Material UI icons (CheckCircleIcon, CancelIcon)
- Material UI components (Box, Stack, Chip, Tooltip, Typography, etc.)
