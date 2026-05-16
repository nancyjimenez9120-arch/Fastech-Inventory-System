import React, { useState, useEffect } from 'react';

export default function App() {
  const [productos, setProductos] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  
  // Estado para el buscador
  const [busqueda, setBusqueda] = useState('');

  const [modalEliminar, setModalEliminar] = useState({ mostrar: false, id: null });
  const [modalCompraExito, setModalCompraExito] = useState({ mostrar: false, producto: null });

  // IP fija de la laptop para que funcione en PC y celulares conectados a la red compartida
  const IP_SERVIDOR = '10.217.90.210';

  useEffect(() => {
    fetch(`http://${IP_SERVIDOR}:3000/productos`)
      .then(res => res.json())
      .then(data => setProductos(data))
      .catch(err => console.error("Error cargando productos:", err));

    fetch(`http://${IP_SERVIDOR}:3000/ventas`)
      .then(res => res.json())
      .then(data => setHistorial(data))
      .catch(err => console.error("Error cargando historial:", err));
  }, []);

  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nombre || !precio || !stock) return alert("⚠️ Por favor, llena todos los campos");
    const nuevo = { nombre, precio: parseFloat(precio), stock: parseInt(stock) };
    try {
      const res = await fetch(`http://${IP_SERVIDOR}:3000/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
      const guardado = await res.json();
      setProductos([...productos, guardado]);
      setNombre(''); setPrecio(''); setStock('');
    } catch (error) { alert("❌ Error al guardar"); }
  };

  const comprarProducto = async (producto) => {
    if (producto.stock <= 0) {
      alert("⚠️ ¡Agotado! No hay existencias de " + producto.nombre);
      return;
    }
    const nuevoStock = producto.stock - 1;
    try {
      const res = await fetch(`http://${IP_SERVIDOR}:3000/productos/${producto.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: nuevoStock, nombre: producto.nombre, precio: producto.precio, esCompra: true })
      });
      if (res.ok) {
        setProductos(productos.map(p => p.id === producto.id ? { ...p, stock: nuevoStock } : p));
        setModalCompraExito({ mostrar: true, producto: producto });
        const resVentas = await fetch(`http://${IP_SERVIDOR}:3000/ventas`);
        const datosVentas = await resVentas.json();
        setHistorial(datosVentas);
      }
    } catch (error) { alert("❌ Error en la compra"); }
  };

  const ejecutarEliminado = async () => {
    try {
      await fetch(`http://${IP_SERVIDOR}:3000/productos/${modalEliminar.id}`, { method: 'DELETE' });
      setProductos(productos.filter(p => p.id !== modalEliminar.id));
      setModalEliminar({ mostrar: false, id: null });
    } catch (error) { alert("❌ No se pudo eliminar"); }
  };

  // --- CÁLCULOS AUTOMÁTICOS PARA LOS WIDGETS ---
  const totalProductos = productos.length;
  const gananciasTotales = historial.reduce((suma, venta) => suma + parseFloat(venta.precio), 0);

  // --- FILTRAR PRODUCTOS SEGÚN LA BÚSQUEDA ---
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // --- NUEVA FUNCIÓN: OBTENER EMOJI SEGÚN EL NOMBRE ---
  const obtenerEmoji = (nombreProducto) => {
    const texto = nombreProducto.toLowerCase();
    if (texto.includes('cable') || texto.includes('usb')) return '🔌';
    if (texto.includes('arduino') || texto.includes('placa') || texto.includes('chip') || texto.includes('modulo')) return '⚡';
    if (texto.includes('teclado')) return '⌨️';
    if (texto.includes('mouse') || texto.includes('raton')) return '🖱️';
    if (texto.includes('pantalla') || texto.includes('display') || texto.includes('led')) return '🖥️';
    if (texto.includes('bateria') || texto.includes('pila')) return '🔋';
    if (texto.includes('sensor')) return '👁️‍🗨️';
    if (texto.includes('motor')) return '⚙️';
    return '📦'; // Emoji por defecto si no coincide con ninguno
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        
        {/* Encabezado */}
        <header style={styles.mainHeader}>
          <h1 style={styles.mainTitle}>🚀 FASTECH <span style={{color: '#f6b93b'}}>INVENTORY</span></h1>
          <p style={styles.mainSubtitle}>Sistema Avanzado de Gestión de Productos & Ventas en MySQL</p>
        </header>

        {/* --- SECCIÓN: BIENVENIDA Y RESUMEN --- */}
        <div style={styles.welcomeRow}>
          <div>
            <h2 style={styles.welcomeUser}>¡Hola de nuevo, Nancy! 👋</h2>
            <p style={styles.welcomeDate}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          {/* Tarjetas de Estadísticas */}
          <div style={styles.statsContainer}>
            <div style={styles.statCard}>
              <span style={styles.statLabel}>ITEMS REGISTRADOS</span>
              <span style={styles.statNumber}>{totalProductos}</span>
            </div>
            <div style={{...styles.statCard, borderLeft: '4px solid #27ae60'}}>
              <span style={styles.statLabel}>GANANCIAS TOTALES</span>
              <span style={{...styles.statNumber, color: '#27ae60'}}>${gananciasTotales.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div style={styles.formCard}>
          <h2 style={styles.formTitle}>➕ Registrar Nuevo Artículo</h2>
          <form onSubmit={agregarProducto} style={styles.formRow}>
            <input style={styles.input} placeholder="Nombre del componente / gadget" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input style={styles.input} type="number" step="0.01" placeholder="Precio ($)" value={precio} onChange={e => setPrecio(e.target.value)} />
            <input style={styles.input} type="number" placeholder="Stock Inicial" value={stock} onChange={e => setStock(e.target.value)} />
            <button type="submit" style={styles.buttonAdd}>Guardar en DB</button>
          </form>
        </div>

        {/* --- BARRA DE BÚSQUEDA --- */}
        <div style={styles.searchBarContainer}>
          <input 
            style={styles.searchInput} 
            placeholder="🔍 Buscar componente en tiempo real..." 
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* --- SECCIÓN DINÁMICA DEL CATÁLOGO --- */}
        <h2 style={{
          ...styles.sectionTitle,
          borderLeft: busqueda !== '' && productosFiltrados.length === 0 ? '4px solid #ff4d4d' : '4px solid #f6b93b'
        }}>
          {busqueda === '' 
            ? '📦 Catálogo de Componentes Disponibles' 
            : productosFiltrados.length > 0 
              ? '✓ Productos Encontrados' 
              : '❌ Producto no disponible'}
        </h2>

        {/* Mensaje condicional si no se encuentra el producto */}
        {productosFiltrados.length === 0 && busqueda !== '' ? (
          <div style={styles.noProductAlert}>
            <div style={styles.alertIcon}>🔍</div>
            <h3 style={styles.alertTitle}>El producto que buscas no está en el catálogo</h3>
            <p style={styles.alertText}>Verifica que el nombre esté bien escrito o regístralo como un nuevo artículo en el formulario de arriba.</p>
          </div>
        ) : (
          /* Grid de Tarjetas (Se muestra si hay coincidencias) */
          <div style={styles.gridContainer}>
            {productosFiltrados.map(p => {
              const tienePocoStock = p.stock < 5;
              const estaAgotado = p.stock <= 0;
              
              return (
                <div key={p.id} style={{
                  ...styles.productCard,
                  border: estaAgotado ? '1px solid rgba(231, 76, 60, 0.2)' : tienePocoStock ? '1px solid rgba(255, 77, 77, 0.4)' : '1px solid #1f293d',
                  boxShadow: estaAgotado ? 'none' : tienePocoStock ? '0 8px 24px rgba(255, 77, 77, 0.1)' : '0 8px 24px rgba(0,0,0,0.2)',
                  opacity: estaAgotado ? 0.4 : 1,
                  transition: 'opacity 0.3s ease, border 0.3s ease'
                }}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardId}>#{p.id}</span>
                    <span style={estaAgotado ? styles.tagLowStock : tienePocoStock ? styles.tagLowStock : styles.tagInStock}>
                      {estaAgotado ? '❌ Agotado' : tienePocoStock ? '⚠️ ¡Pocas unidades!' : '✓ Disponible'}
                    </span>
                  </div>
                  
                  {/* --- Imagen decorativa con el Emoji Dinámico --- */}
                  <div style={styles.avatarContainer}>
                    <span style={styles.avatarEmoji}>{obtenerEmoji(p.nombre)}</span>
                  </div>
                  
                  <h3 style={styles.cardName}>{p.nombre}</h3>
                  
                  <div style={styles.cardInfoRow}>
                    <div>
                      <span style={styles.infoLabel}>PRECIO</span>
                      <div style={styles.cardPrice}>${p.precio}</div>
                    </div>
                    <div style={{textAlign: 'right'}}>
                      <span style={styles.infoLabel}>STOCK</span>
                      <div style={{...styles.cardStock, color: estaAgotado || tienePocoStock ? '#ff4d4d' : '#f6b93b'}}>{p.stock} uds</div>
                    </div>
                  </div>

                  <div style={styles.cardActions}>
                    <button onClick={() => comprarProducto(p)} style={{
                      ...styles.btnBuyCard,
                      backgroundColor: estaAgotado ? '#242b35' : '#27ae60',
                      color: estaAgotado ? '#52637a' : 'white',
                      cursor: estaAgotado ? 'not-allowed' : 'pointer'
                    }} disabled={estaAgotado}>
                      {estaAgotado ? '🚫 Agotado' : '🛒 Comprar Uno'}
                    </button>
                    <button onClick={() => setModalEliminar({ mostrar: true, id: p.id })} style={styles.btnDelCard} title="Eliminar Producto">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Historial */}
        <div style={styles.historySection}>
          <h2 style={styles.historyTitle}>📜 Historial de Ventas Recientes (Real-Time)</h2>
          {historial.length === 0 ? (
            <p style={styles.noHistory}>Ninguna transacción registrada en el bloque actual de MySQL.</p>
          ) : (
            <div style={styles.timelineContainer}>
              {historial.map(v => (
                <div key={v.id} style={styles.timelineItem}>
                  <div style={styles.timelineDot}></div>
                  <div style={styles.timelineContent}>
                    <div style={styles.timelineMain}>
                      <span style={styles.timelineName}>Venta de: <b>{v.producto_nombre}</b></span>
                      <span style={styles.timelinePrice}>+ ${v.precio}</span>
                    </div>
                    <span style={styles.timelineDate}>{new Date(v.fecha).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL ELIMINAR */}
      {modalEliminar.mostrar && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitleAlert}>🚨 ¿Confirmar Acción Crítica?</h3>
            <p style={styles.modalText}>Estás a punto de borrar permanentemente este registro de tu servidor MySQL.</p>
            <div style={styles.modalButtons}>
              <button onClick={() => setModalEliminar({ mostrar: false, id: null })} style={styles.btnCancelar}>Abortar</button>
              <button onClick={ejecutarEliminado} style={styles.btnConfirmar}>Sí, Eliminar de DB</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO COMPRA */}
      {modalCompraExito.mostrar && (
        <div style={styles.overlay}>
          <div style={styles.modalSuccess}>
            <div style={styles.successIcon}>⚡</div>
            <h3 style={styles.modalTitleSuccess}>¡Transacción Procesada!</h3>
            <p style={styles.modalText}>Se ha generado un bloque de venta para:</p>
            <p style={styles.modalTextBold}>{modalCompraExito.producto?.nombre}</p>
            <button onClick={() => setModalCompraExito({ mostrar: false, producto: null })} style={styles.btnEntendido}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { backgroundColor: '#0b0f19', minHeight: '100vh', padding: '60px 20px', fontFamily: '"Segoe UI", Roboto, sans-serif', color: '#e4e7eb' },
  wrapper: { maxWidth: '1000px', margin: 'auto' },
  mainHeader: { textAlign: 'center', marginBottom: '40px' },
  mainTitle: { fontSize: '38px', fontWeight: '800', letterSpacing: '1.5px', margin: '0 0 10px 0', color: '#ffffff' },
  mainSubtitle: { color: '#6b7b95', fontSize: '15px', margin: 0 },
  
  // Estilos de la Bienvenida
  welcomeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '35px', borderBottom: '1px solid #1f293d', paddingBottom: '25px' },
  welcomeUser: { fontSize: '24px', fontWeight: '700', color: '#ffffff', margin: '0 0 5px 0' },
  welcomeDate: { color: '#6b7b95', fontSize: '14px', margin: 0 },
  statsContainer: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  statCard: { backgroundColor: '#111827', padding: '15px 25px', borderRadius: '12px', borderLeft: '4px solid #f6b93b', display: 'flex', flexDirection: 'column', gap: '5px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' },
  statLabel: { fontSize: '10px', color: '#6b7b95', fontWeight: '700', letterSpacing: '0.5px' },
  statNumber: { fontSize: '22px', fontWeight: '800', color: '#ffffff' },

  // Buscador
  searchBarContainer: { marginBottom: '30px' },
  searchInput: { width: '100%', padding: '14px 20px', borderRadius: '12px', border: '1px solid #1f293d', backgroundColor: '#111827', color: 'white', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },

  // Estilos para Producto No Encontrado
  noProductAlert: { backgroundColor: '#111827', border: '1px solid rgba(255, 77, 77, 0.3)', padding: '40px 20px', borderRadius: '16px', textAlign: 'center', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
  alertIcon: { fontSize: '42px', marginBottom: '12px' },
  alertTitle: { color: '#ff4d4d', margin: '0 0 10px 0', fontSize: '20px', fontWeight: '600' },
  alertText: { color: '#6b7b95', margin: 0, fontSize: '15px', lineHeight: '1.5' },

  // Formulario
  formCard: { backgroundColor: '#111827', padding: '25px', borderRadius: '16px', border: '1px solid #1f293d', marginBottom: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  formTitle: { fontSize: '18px', margin: '0 0 20px 0', color: '#f6b93b', fontWeight: '600' },
  formRow: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  input: { flex: 1, minWidth: '180px', padding: '14px', borderRadius: '10px', border: '1px solid #1f293d', backgroundColor: '#1f293d', color: 'white', fontSize: '15px', outline: 'none' },
  buttonAdd: { backgroundColor: '#f6b93b', color: '#0b0f19', padding: '14px 28px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' },

  // Contenedor del Emoji decorativo
  avatarContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f293d', borderRadius: '12px', padding: '20px', margin: '5px 0' },
  avatarEmoji: { fontSize: '45px' },

  // Grid de Tarjetas
  sectionTitle: { fontSize: '22px', color: '#ffffff', marginBottom: '25px', paddingLeft: '12px', transition: 'border-left 0.3s ease' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', marginBottom: '60px' },
  productCard: { backgroundColor: '#111827', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '15px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardId: { color: '#4b5b75', fontSize: '14px', fontWeight: '600' },
  tagInStock: { backgroundColor: 'rgba(39, 174, 96, 0.15)', color: '#2ecc71', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  tagLowStock: { backgroundColor: 'rgba(231, 76, 60, 0.15)', color: '#e74c3c', fontSize: '12px', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  cardName: { fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 },
  cardInfoRow: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#1f293d', padding: '12px 16px', borderRadius: '12px' },
  infoLabel: { fontSize: '10px', color: '#6b7b95', fontWeight: '700', letterSpacing: '1px' },
  cardPrice: { fontSize: '20px', fontWeight: '700', color: '#2ecc71', marginTop: '2px' },
  cardStock: { fontSize: '18px', fontWeight: '700', marginTop: '2px' },
  cardActions: { display: 'flex', gap: '10px', marginTop: '10px' },
  btnBuyCard: { color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', flex: 1 },
  btnDelCard: { backgroundColor: 'transparent', color: '#ff4d4d', border: '1px solid rgba(255,77,77,0.3)', padding: '12px', borderRadius: '10px', cursor: 'pointer' },

  // Historial
  historySection: { backgroundColor: '#111827', padding: '30px', borderRadius: '20px', border: '1px solid #1f293d' },
  historyTitle: { fontSize: '20px', color: '#ffffff', margin: '0 0 25px 0' },
  noHistory: { color: '#4b5b75', fontStyle: 'italic', margin: 0 },
  timelineContainer: { display: 'flex', flexDirection: 'column', borderLeft: '2px solid #1f293d', paddingLeft: '20px', marginLeft: '10px' },
  timelineItem: { position: 'relative', paddingBottom: '20px' },
  timelineDot: { position: 'absolute', left: '-26px', top: '4px', width: '10px', height: '10px', backgroundColor: '#27ae60', borderRadius: '50%', border: '4px solid #111827' },
  timelineContent: { backgroundColor: '#1f293d', padding: '14px 20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  timelineMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  timelineName: { fontSize: '15px', color: '#e4e7eb' },
  timelinePrice: { color: '#2ecc71', fontWeight: '700', fontSize: '16px' },
  timelineDate: { fontSize: '12px', color: '#6b7b95' },

  // Modales
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5, 7, 12, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#111827', padding: '35px', borderRadius: '24px', border: '1px solid #1f293d', textAlign: 'center', maxWidth: '400px' },
  modalSuccess: { backgroundColor: '#111827', padding: '35px', borderRadius: '24px', border: '1px solid #27ae60', textAlign: 'center', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  successIcon: { width: '50px', height: '50px', borderRadius: '50%', backgroundColor: 'rgba(39,174,96,0.1)', color: '#27ae60', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '24px', marginBottom: '15px' },
  modalTitleAlert: { color: '#ff4d4d', marginTop: 0, fontSize: '22px', fontWeight: '700' },
  modalTitleSuccess: { color: '#27ae60', marginTop: 0, fontSize: '22px', fontWeight: '700' },
  modalText: { color: '#6b7b95', margin: '10px 0', fontSize: '15px', lineHeight: '1.5' },
  modalTextBold: { color: 'white', fontWeight: 'bold', fontSize: '20px', margin: '10px 0' },
  modalButtons: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' },
  btnCancelar: { padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: '#1f293d', color: 'white', fontSize: '15px', fontWeight: '600' },
  btnConfirmar: { padding: '12px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: '#ff4d4d', color: 'white', fontWeight: 'bold', fontSize: '15px' },
  btnEntendido: { padding: '12px 40px', borderRadius: '10px', border: 'none', cursor: 'pointer', backgroundColor: '#27ae60', color: 'white', fontWeight: 'bold', fontSize: '15px', marginTop: '15px', width: '100%' }
};