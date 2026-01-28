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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
`;


