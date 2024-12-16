import React from "react";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useSeedContext } from "../context/SeedContext";
import { useCloneContext } from "../context/CloneContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const Profile: React.FC = () => {
  const { seeds } = useSeedContext();
  const { clones } = useCloneContext();

  // Mock user data
  const username = "John Doe";
  const avatarUrl = "https://i.pravatar.cc/150";

  // Featured Seeds and Clones (example: top 3)
  const featuredSeeds = seeds.slice(0, 3);
  const featuredClones = clones.slice(0, 3);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar alt={username} src={avatarUrl} sx={{ width: 80, height: 80 }} />
        <Typography variant="h5" sx={{ ml: 2 }}>
          {username}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>
        Featured Seeds
      </Typography>
      <List>
        {featuredSeeds.map((seed) => (
          <ListItem key={seed.id}>
            <ListItemText
              primary={seed.strain}
              secondary={`${seed.breeder} // Available? ${seed.available}`}
            />
            //change true/false to icon
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Featured Clones
      </Typography>
      <List>
        {featuredClones.map((clone) => (
          <ListItem key={clone.id}>
            <ListItemText
              primary={`${clone.strain} // ${clone.cutName}`}
              secondary={`${clone.breeder}`}
            />
            {clone.available ? <CheckCircleIcon /> : <CancelIcon />}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default Profile;
