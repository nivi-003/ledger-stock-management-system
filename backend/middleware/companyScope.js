// Middleware to ensure company ID is provided and scoped for APIs
export const companyScope = (req, res, next) => {
  // Routes that do not require company scoping header
  const bypassRoutes = ['/api/companies', '/api/settings/backup', '/api/settings/restore'];
  const isBypass = bypassRoutes.some((route) => req.originalUrl.startsWith(route));

  if (isBypass) {
    return next();
  }

  const companyId = req.headers['x-company-id'];

  if (!companyId) {
    res.status(400);
    return next(new Error('Active Company Context Missing. Please specify x-company-id header.'));
  }

  req.companyId = companyId;
  next();
};
