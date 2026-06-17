// Estilos CSS para animaciones suaves
export const styles = `
  .card-transition {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-expand {
    animation: expandCard 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card-shrink {
    animation: shrinkCard 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes expandCard {
    from {
      opacity: 0.7;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes shrinkCard {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0.7;
      transform: scale(0.95);
    }
  }
  
  .fade-in {
    animation: fadeIn 0.3s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .smooth-hover {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .smooth-hover:hover {
    transform: translateY(-2px);
    box-shadow: none;
  }
  
  .btn {
    transition: all 0.2s ease;
  }
  
  .btn:hover {
    transform: scale(1.05);
  }
  
  .btn:active {
    transform: scale(0.98);
  }
  
  .form-control, .form-select {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }
  
  .form-control:focus, .form-select:focus {
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }
  
  .input-group {
    transition: all 0.2s ease;
  }
  
  .nav-tabs .nav-link {
    transition: all 0.2s ease;
  }
  
  .card-body {
    transition: padding 0.3s ease;
  }

  /* =========================================================
     Capa de reskin NEWLOOK — scopeada a .gs-content
     Moderniza los componentes Bootstrap legacy de los tabs
     (Mercadería, Embutidos, Empleados, Gastos, Clientes,
     Pagos Proveedores) sin tocar su markup ni su lógica.
     Tokens: ver README-NEWLOOK.md (Steel Blue #6A8899).
     ========================================================= */

  /* Cards: borde visible pero suave, sin sombra, esquinas suaves */
  .gs-content .card {
    border: 1px solid #d3d9de;
    border-radius: 12px;
    box-shadow: none;
    overflow: hidden;
  }
  .gs-content .card:hover { box-shadow: none; }

  /* Bordes de color completos -> acento izquierdo (regla NEWLOOK) */
  .gs-content .card.border-primary   { border: 1px solid #d3d9de !important; border-left: 3px solid #6A8899 !important; }
  .gs-content .card.border-success   { border: 1px solid #d3d9de !important; border-left: 3px solid #28a745 !important; }
  .gs-content .card.border-danger    { border: 1px solid #d3d9de !important; border-left: 3px solid #dc3545 !important; }
  .gs-content .card.border-warning   { border: 1px solid #d3d9de !important; border-left: 3px solid #FFD166 !important; }
  .gs-content .card.border-secondary { border: 1px solid #d3d9de !important; }

  /* Headers de card: estilo "eyebrow / overline" (kicker).
     Label en mayúsculas, tracking amplio, color de marca tenue.
     Sin barra de acento (era repetitiva con el patrón de cards). */
  .gs-content .card-header {
    background: #ffffff !important;
    color: #6A8899 !important;
    border-bottom: 1px solid #dde2e6;
    border-left: none !important;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    padding: 14px 16px 11px;
  }
  .gs-content .card-header h5,
  .gs-content .card-header h6 {
    color: #6A8899 !important;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.09em;
    margin: 0;
  }
  /* Íconos del header proporcionales al label pequeño */
  .gs-content .card-header h5 svg,
  .gs-content .card-header h6 svg {
    width: 13px !important;
    height: 13px !important;
    opacity: 0.85;
  }

  /* Botones: rebranding al acero + flatten del hover */
  .gs-content .btn { border-radius: 9px; font-weight: 600; }
  .gs-content .btn:hover { transform: translateY(-1px); }
  .gs-content .btn:active { transform: translateY(0); }
  .gs-content .btn-primary {
    background: #6A8899; border-color: #6A8899; color: #fff;
  }
  .gs-content .btn-primary:hover { background: #506878; border-color: #506878; }
  .gs-content .btn-outline-primary { color: #3a5060; border-color: #6A8899; }
  .gs-content .btn-outline-primary:hover { background: #6A8899; border-color: #6A8899; color: #fff; }
  .gs-content .btn-success { background: #28a745; border-color: #28a745; }
  .gs-content .btn-success:hover { background: #1f8a3a; border-color: #1f8a3a; }
  .gs-content .btn-warning { background: #FFD166; border-color: #FFD166; color: #7a5b00; }
  .gs-content .btn-warning:hover { background: #f0c14e; border-color: #f0c14e; color: #7a5b00; }
  .gs-content .btn-outline-secondary { color: #6c757d; border-color: #dee2e6; }
  .gs-content .btn-lg { font-size: 0.95rem; padding: 10px 18px; }

  /* Badges sólidos -> pills suaves (regla NEWLOOK, 8-25% opacidad) */
  .gs-content .badge.bg-primary   { background: rgba(106,136,153,0.15) !important; color: #3a5060 !important; font-weight: 600; }
  .gs-content .badge.bg-secondary { background: #eef1f3 !important; color: #6c757d !important; font-weight: 600; }
  .gs-content .badge.bg-danger    { background: rgba(220,53,69,0.12) !important; color: #8b1c26 !important; font-weight: 600; }
  .gs-content .badge.bg-success   { background: rgba(40,167,69,0.12) !important; color: #1a5c2a !important; font-weight: 600; }
  .gs-content .badge.bg-warning   { background: rgba(255,209,102,0.25) !important; color: #856404 !important; font-weight: 600; }
  .gs-content .badge.bg-info      { background: rgba(106,136,153,0.15) !important; color: #3a5060 !important; font-weight: 600; }
  .gs-content .badge { border-radius: 999px; padding: 3px 10px; }

  /* Texto de acento -> acero */
  .gs-content .text-primary { color: #3a5060 !important; }
  .gs-content .text-info { color: #5a7585 !important; }

  /* Tablas limpias: sin bordes duros, header uppercase gris */
  .gs-content .table { font-size: 0.85rem; }
  .gs-content .table-bordered,
  .gs-content .table-bordered th,
  .gs-content .table-bordered td { border: none; }
  .gs-content .table th, .gs-content .table td {
    border-top: none;
    border-bottom: 1px solid #e1e5e9;
    vertical-align: middle;
  }
  .gs-content .table thead th,
  .gs-content .table thead.table-light th {
    background: transparent;
    color: #9ca3af;
    font-size: 0.66rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    border-bottom: 1px solid #d3d9de;
  }

  /* Alerts -> cajas suaves redondeadas sin borde */
  .gs-content .alert { border: none; border-radius: 10px; }
  .gs-content .alert-info    { background: rgba(106,136,153,0.10); color: #3a5060; }
  .gs-content .alert-success { background: rgba(40,167,69,0.10);  color: #1a5c2a; }
  .gs-content .alert-danger  { background: rgba(220,53,69,0.10);  color: #8b1c26; }
  .gs-content .alert-warning { background: rgba(255,209,102,0.15); color: #856404; }

  /* Inputs: borde visible + foco con color de marca */
  .gs-content .form-control,
  .gs-content .form-select { border-radius: 9px; border-color: #ccd3d9; }
  .gs-content .input-group-text { border-color: #ccd3d9; background: #eef1f3; color: #5a6b76; }
  .gs-content .form-control:focus,
  .gs-content .form-select:focus {
    border-color: #6A8899;
    box-shadow: 0 0 0 0.2rem rgba(106,136,153,0.15);
  }
  .gs-content .form-control-lg,
  .gs-content .form-select-lg { font-size: 0.95rem; }
  .gs-content .form-label.fw-bold {
    font-size: 0.7rem;
    font-weight: 600 !important;
    color: #6c757d;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* Checkboxes con color de marca */
  .gs-content .form-check-input:checked {
    background-color: #6A8899;
    border-color: #6A8899;
  }
  .gs-content .form-check-input:focus {
    border-color: #6A8899;
    box-shadow: 0 0 0 0.2rem rgba(106,136,153,0.15);
  }

  /* Separadores visibles pero suaves */
  .gs-content hr { border-color: #dde2e6; opacity: 1; }
  .gs-content .border-bottom { border-color: #dde2e6 !important; }
  .gs-content .border-top { border-color: #dde2e6 !important; }
  .gs-content .border { border-color: #d3d9de !important; }

  /* Divisor entre grupos de proveedor (Pagos Proveedores) */
  .gs-content .gs-prov-group:not(:last-child) {
    border-bottom: 1px solid #d3d9de;
    padding-bottom: 16px;
    margin-bottom: 18px !important;
  }

  /* =========================================================
     Borde verde giratorio — marca info "siempre a la vista"
     (ej. Totales Semanales). Conic-gradient verde rotando
     alrededor del perímetro, mismo lenguaje que el status
     de Firebase conectado pero recorriendo toda la card.
     ========================================================= */
  .gs-totales-glow {
    position: relative;
    border-radius: 14px;
    padding: 2.5px;            /* grosor del borde animado */
    overflow: hidden;
    isolation: isolate;
    box-shadow: 0 2px 14px rgba(40,167,69,0.16);
  }
  .gs-totales-glow::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 230%;
    height: 230%;
    transform: translate(-50%, -50%);
    background: conic-gradient(
      from 0deg,
      #1f8a3a 0deg,
      #28a745 170deg,
      #8ff0ab 300deg,
      #28a745 340deg,
      #1f8a3a 360deg
    );
    animation: gsTotalesSpin 3.2s linear infinite;
    z-index: -1;
  }
  .gs-totales-glow > .card {
    margin: 0 !important;
    border: none !important;
    border-radius: 11px !important;
    position: relative;
    z-index: 1;
  }
  .gs-totales-glow .card-header { border-left: none !important; }

  @keyframes gsTotalesSpin {
    to { transform: translate(-50%, -50%) rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .gs-totales-glow::before { animation: none; }
  }
`;


