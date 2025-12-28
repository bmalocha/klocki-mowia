// App Navigation Logic

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const screens = document.querySelectorAll('.screen');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');

            // Update Nav State
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update Screen State
            screens.forEach(s => s.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            // Optional: Trigger specific screen logic when entering
            // Stop all cameras first
            if (window.s1_stopCamera) window.s1_stopCamera();
            if (window.s3_stopCamera) window.s3_stopCamera();

            // Start target camera if applicable
            if (targetId === 'screen-1' && window.s1_startCamera) {
                window.s1_startCamera();
            }
            if (targetId === 'screen-3' && window.s3_startCamera) {
                window.s3_startCamera();
            }
        });
    });

    // Initialize Default Screen (Screen 1)
    if (window.s1_startCamera) window.s1_startCamera();
});
