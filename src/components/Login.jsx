import React, { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from 'firebase/auth';
import { useFirebase } from '../contexts/FirebaseContext';

const Login = () => {
  const { auth } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Login exitoso con Google:', result.user.displayName);
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      setError('Error al iniciar sesión con Google: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInAnonymously(auth);
      console.log('✅ Login anónimo exitoso:', result.user.uid);
    } catch (error) {
      console.error('❌ Error en login anónimo:', error);
      setError('Error al iniciar sesión anónima: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#FAFBFF' }}>
      <div className="card p-5" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="text-center mb-4">
          <h2 className="mb-3" style={{ color: '#333' }}>Mi Reparto</h2>
          <p className="text-muted">Elige cómo quieres acceder</p>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <div className="d-grid gap-3">
          {/* Botón de Google */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn btn-primary d-flex align-items-center justify-content-center gap-3"
            style={{ 
              backgroundColor: '#4285f4', 
              borderColor: '#4285f4',
              padding: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Conectando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>
          
          {/* Botón Anónimo */}
          <button 
            onClick={handleAnonymousLogin}
            disabled={loading}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-3"
            style={{ 
              padding: '12px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Conectando...
              </>
            ) : (
              <>
                <i className="fas fa-user-secret"></i>
                Acceso Anónimo
              </>
            )}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <small className="text-muted">
            <strong>Google:</strong> Para administradores<br/>
            <strong>Anónimo:</strong> Acceso rápido temporal
          </small>
        </div>
      </div>
    </div>
  );
};

export default Login;
