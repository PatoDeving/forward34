// Privacy Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Create modal HTML structure
    const modalHTML = `
        <div id="privacyModal" class="privacy-modal-overlay">
            <div class="privacy-modal">
                <div class="privacy-modal-header">
                    <h2>Aviso de Privacidad y Términos</h2>
                    <button class="privacy-modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="privacy-modal-body">
                    <div class="privacy-section">
                        <h3>AVISO DE PRIVACIDAD</h3>
                        <p><strong>Forward34, S.A. de C.V.</strong></p>

                        <p>En cumplimiento con lo dispuesto por la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, Forward34, S.A. de C.V. (en adelante "Forward34"), con domicilio en México, es responsable del uso y protección de sus datos personales.</p>

                        <h3>1. Datos personales que se recaban</h3>
                        <p>Los datos personales que Forward34 puede recabar a través de su sitio web, formularios, correos electrónicos o cualquier otro medio incluyen, de manera enunciativa mas no limitativa:</p>
                        <ul>
                            <li>Nombre completo</li>
                            <li>Correo electrónico</li>
                            <li>Número telefónico</li>
                            <li>Empresa u organización</li>
                            <li>Cargo</li>
                            <li>Información relacionada con servicios solicitados</li>
                        </ul>
                        <p>No recabamos datos personales sensibles.</p>

                        <h3>2. Finalidades del tratamiento</h3>
                        <p>Los datos personales serán utilizados para las siguientes finalidades:</p>
                        <p><strong>Finalidades primarias:</strong></p>
                        <ul>
                            <li>Atender solicitudes de información, contacto o servicios.</li>
                            <li>Establecer comunicación comercial o institucional.</li>
                            <li>Dar seguimiento a relaciones profesionales o contractuales.</li>
                            <li>Enviar información relacionada con nuestros servicios, proyectos o contenidos.</li>
                        </ul>
                        <p><strong>Finalidades secundarias (opcionales):</strong></p>
                        <ul>
                            <li>Envío de comunicaciones informativas, promocionales o de posicionamiento de marca.</li>
                        </ul>
                        <p>El titular puede oponerse al uso de sus datos para finalidades secundarias enviando un correo a <strong>hector@forward34.com</strong>.</p>

                        <h3>3. Transferencia de datos</h3>
                        <p>Forward34 no transferirá sus datos personales a terceros sin su consentimiento, salvo en los casos legalmente permitidos o requeridos por autoridad competente.</p>

                        <h3>4. Derechos ARCO</h3>
                        <p>Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales (Derechos ARCO).</p>
                        <p>Para ejercer estos derechos, deberá enviar una solicitud al correo electrónico:<br>
                        📧 <strong>hector@forward34.com</strong></p>
                        <p>La solicitud deberá contener:</p>
                        <ul>
                            <li>Nombre del titular</li>
                            <li>Medio para comunicar la respuesta</li>
                            <li>Documentos que acrediten identidad</li>
                            <li>Descripción clara del derecho que desea ejercer</li>
                        </ul>

                        <h3>5. Medidas de seguridad</h3>
                        <p>Forward34 adopta medidas administrativas, técnicas y físicas razonables para proteger sus datos personales contra daño, pérdida, alteración o uso no autorizado.</p>

                        <h3>6. Cambios al aviso de privacidad</h3>
                        <p>Forward34 se reserva el derecho de modificar el presente Aviso de Privacidad. Cualquier cambio será publicado en este mismo sitio web.</p>

                        <div class="last-updated">
                            <strong>Última actualización: 1 de enero de 2026</strong>
                        </div>
                    </div>

                    <hr class="divider">

                    <div class="privacy-section">
                        <h3>TÉRMINOS Y CONDICIONES DE USO</h3>
                        <p><strong>Forward34, S.A. de C.V.</strong></p>

                        <p>El acceso y uso del sitio web de Forward34, S.A. de C.V. implica la aceptación plena de los presentes Términos y Condiciones.</p>

                        <h3>1. Uso del sitio web</h3>
                        <p>El usuario se compromete a utilizar este sitio únicamente para fines lícitos y de conformidad con la legislación aplicable. Queda prohibido cualquier uso que pueda dañar, inutilizar o afectar el funcionamiento del sitio o de terceros.</p>

                        <h3>2. Propiedad intelectual</h3>
                        <p>Todos los contenidos del sitio, incluyendo textos, imágenes, logotipos, gráficos, diseño, estructura y materiales, son propiedad de Forward34 o cuentan con los derechos necesarios para su uso.</p>
                        <p>Queda estrictamente prohibida su reproducción, distribución o modificación sin autorización previa y por escrito.</p>

                        <h3>3. Información y contenidos</h3>
                        <p>La información publicada tiene fines informativos y corporativos. Forward34 no garantiza que el contenido sea exacto, completo o actualizado en todo momento, y se reserva el derecho de modificarlo sin previo aviso.</p>

                        <h3>4. Limitación de responsabilidad</h3>
                        <p>Forward34 no será responsable por daños directos o indirectos derivados del uso o imposibilidad de uso del sitio web, ni por interrupciones, errores técnicos o virus.</p>

                        <h3>5. Enlaces a terceros</h3>
                        <p>Este sitio puede contener enlaces a sitios externos. Forward34 no se responsabiliza por el contenido, políticas o prácticas de dichos sitios.</p>

                        <h3>6. Modificaciones</h3>
                        <p>Forward34 se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Las modificaciones entrarán en vigor a partir de su publicación en el sitio web.</p>

                        <h3>7. Legislación aplicable</h3>
                        <p>Estos Términos y Condiciones se rigen por las leyes aplicables en los Estados Unidos Mexicanos, y cualquier controversia se someterá a los tribunales competentes en México.</p>

                        <div class="last-updated">
                            <strong>Última actualización: 1 de enero de 2026</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Inject modal into body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Get modal elements
    const modal = document.getElementById('privacyModal');
    const closeBtn = modal.querySelector('.privacy-modal-close');
    const privacyLinks = document.querySelectorAll('.open-privacy-modal');

    // Open modal function
    function openModal() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close modal function
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners for opening modal
    privacyLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });

    // Event listener for close button
    closeBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});
