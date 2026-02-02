/**
 * Hook reutilizable para auto-guardar antes de imprimir.
 * Evita pérdida de datos cuando el usuario imprime sin haber guardado primero.
 *
 * Uso: SaldoClientes, Transferencias, etc.
 */
export function useAutoSavePrint({
  summaryData,
  savedItems = [],
  checkIsAlreadySaved,
  saveWithoutClear,
  onAfterSave,
  showSuccess,
  showError
}) {
  /**
   * Ejecuta la impresión, guardando automáticamente si no está guardado.
   * @param {Function} getPrintData - (summaryData) => datos para imprimir
   * @param {Function} openPrintModal - (printData) => void - abre el modal de impresión
   */
  const handlePrintWithAutoSave = async (getPrintData, openPrintModal) => {
    if (!summaryData) {
      showError('No hay datos para imprimir');
      return;
    }

    const yaGuardado = checkIsAlreadySaved(summaryData, savedItems);

    if (!yaGuardado) {
      try {
        await saveWithoutClear();
        showSuccess('✓ Datos guardados automáticamente antes de imprimir');
        onAfterSave?.();
      } catch (error) {
        console.error('❌ Error al guardar antes de imprimir:', error);
        showError('Error al guardar: ' + (error?.message || 'Error desconocido'));
        return;
      }
    }

    const printData = getPrintData(summaryData);
    openPrintModal(printData);
  };

  return { handlePrintWithAutoSave };
}
