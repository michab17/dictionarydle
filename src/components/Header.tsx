import '../css/Header.css'

function Header() {
  return (
    <header className="app-header">
        <h1 className="logo">Dictionary-dle</h1>

        <nav className="nav">
            <ul className="nav-list">
                <li>
                    <button>Help</button>
                </li>
                <li>
                    <button>About Me</button>
                </li>
                <li>
                    <a href="https://ko-fi.com/yourname" target="_blank" rel="noopener noreferrer">
                        Ko-fi
                    </a>
                </li>
            </ul>
        </nav>
    </header>
  );
}

export default Header;
