// === INSERT AFTER: import Templates from './components/Templates.jsx'; ===
import Configuration from './components/Configuration.jsx';

// === REPLACE:
//   case 'templates':     return <Templates />;
//   default:              return <Dashboard />;
// ===
      case 'templates':      return <Templates />;
      case 'configuration':  return <Configuration />;
      default:               return <Dashboard />;
