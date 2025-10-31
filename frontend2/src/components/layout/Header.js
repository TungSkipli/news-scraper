import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Select,
  MenuItem,
  Button,
  IconButton,
  Menu,
  Stack,
  Container
} from '@mui/material';
import { useRouter } from 'next/router';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

const Header = () => {
  const router = useRouter();
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState('');
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      if (data.success) setSources(data.data);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const handleNavigate = (path) => {
    router.push(path);
    setMobileMenuAnchor(null);
  };

  const handleSourceChange = (e) => {
    const sourceId = e.target.value;
    setSelectedSource(sourceId);
    if (sourceId) {
      router.push(`/?source_id=${sourceId}`);
    } else {
      router.push('/');
    }
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'News', path: '/news' },
    { label: 'Scraper', path: '/scraper' }
  ];

  const isActive = (path) => router.pathname === path;

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'background.paper',
        color: 'text.primary',
        boxShadow: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: 70
        }}
      >

        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#9f224e',
            cursor: 'pointer',
            letterSpacing: -0.5
          }}
          onClick={() => handleNavigate('/')}
        >
          NewsHub
        </Typography>

        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1
          }}
        >

          <Select
            value={selectedSource}
            onChange={handleSourceChange}
            sx={{
              width: 180,
              height: 40,
              fontSize: 13,
              mr: 2
            }}
            displayEmpty
          >
            <MenuItem value="">All Sources</MenuItem>
            {sources.map((source) => (
              <MenuItem key={source.id} value={source.id}>
                {source.name}
              </MenuItem>
            ))}
          </Select>

          <Stack direction="row" spacing={0}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                sx={{
                  color: isActive(item.path) ? '#9f224e' : 'text.primary',
                  fontWeight: isActive(item.path) ? 700 : 500,
                  fontSize: 13,
                  px: 2,
                  borderBottom: isActive(item.path) ? '2px solid #9f224e' : 'none',
                  borderRadius: 0,
                  '&:hover': {
                    color: '#9f224e',
                    backgroundColor: 'transparent'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Box>

        <IconButton
          sx={{ display: { xs: 'flex', md: 'none' } }}
          onClick={handleMobileMenuOpen}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      <Menu
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        sx={{
          '& .MuiPaper-root': {
            width: '100%',
            mt: 1,
            borderRadius: 0
          }
        }}
      >
        {navItems.map((item) => (
          <MenuItem
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            sx={{
              color: isActive(item.path) ? '#9f224e' : 'text.primary',
              fontWeight: isActive(item.path) ? 700 : 500
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </AppBar>
  );
};

export default Header;
