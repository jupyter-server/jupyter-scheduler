import { NavigateNextRounded } from '@mui/icons-material';
import { Link, Breadcrumbs as MuiBreadcrumbs, Typography } from '@mui/material';
import React, { FC } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const breadcrumbNameMap: { [key: string]: string } = {
  runs: 'Runs',
  new: 'Create workflow',
  'job-definitions': 'Workflows'
};

export const Breadcrumbs: FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(Boolean);

  if (pathnames.length === 1) {
    return null;
  }

  return (
    <MuiBreadcrumbs
      sx={{ p: 3 }}
      aria-label="breadcrumb"
      separator={<NavigateNextRounded fontSize="small" />}
    >
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = breadcrumbNameMap[value] ?? value;

        return last ? (
          <Typography color="text.primary" key={to}>
            {displayName}
          </Typography>
        ) : (
          <Link
            to={to}
            key={to}
            color="primary"
            underline="hover"
            component={RouterLink}
          >
            {displayName}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
