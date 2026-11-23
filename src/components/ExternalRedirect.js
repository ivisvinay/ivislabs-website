import { useEffect } from 'react';
import Loader from './Loader';

// Sends visitors straight to an external IVIS LABS property (e.g. the PulseAI
// or Pulse Academy sites) instead of rendering an in-app page.
const ExternalRedirect = ({ to }) => {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return <Loader />;
};

export default ExternalRedirect;
