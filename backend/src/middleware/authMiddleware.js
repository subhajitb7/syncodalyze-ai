import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

const protect = async (req, res, next) => {
  let token = req.cookies.jwt;
  console.log(`[AUTH] protect middleware triggered for: ${req.originalUrl} | Token found: ${token ? 'Yes (' + token.substring(0, 10) + '...)' : 'No'}`);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      next();
    } catch (error) {
      console.error(`[AUTH] Token verification failed: ${error.message}`);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('[AUTH] Authorization failed: No JWT token found in cookies');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
