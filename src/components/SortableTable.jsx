import React, { useEffect, useRef } from 'react';
import Sortable from 'sortablejs';

const SortableTable = ({ 
  children, 
  onSortEnd, 
  className = '', 
  sortableOptions = {} 
}) => {
  const tableRef = useRef(null);
  const sortableRef = useRef(null);

  useEffect(() => {
    if (tableRef.current) {
      const tbody = tableRef.current.querySelector('tbody');
      if (tbody) {
        sortableRef.current = Sortable.create(tbody, {
          animation: 150,
          ghostClass: 'sortable-ghost',
          onEnd: (evt) => {
            if (onSortEnd) {
              onSortEnd(evt);
            }
          },
          ...sortableOptions
        });
      }
    }

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
      }
    };
  }, [onSortEnd, sortableOptions]);

  return (
    <div className={`table-responsive ${className}`}>
      <table className="table table-bordered mt-3" ref={tableRef}>
        {children}
      </table>
    </div>
  );
};

export default SortableTable;


