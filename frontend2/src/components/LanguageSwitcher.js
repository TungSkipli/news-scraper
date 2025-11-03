import React from 'react';
import { useRouter } from 'next/router';
import { Box, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'next-i18next';
import { t } from 'i18next';

const LanguageSwitcher = () => { 
  const router = useRouter();
  const { i18n } = useTranslation();

  const handleLanguageChange = (event) => {
    const language = event.target.value;
    router.push(router.asPath, router.asPath, { locale: language });
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <Select
        value={router.locale || 'vi'}
        onChange={handleLanguageChange}
        sx={{ width: '100%', height: 40 }}
      >
        <MenuItem value="en">
          🇺🇸 English
        </MenuItem>
        <MenuItem value="vi">
          🇻🇳 Tiếng Việt
        </MenuItem>
      </Select>
    </Box>
  );
};


export default LanguageSwitcher;