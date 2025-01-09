// assets/js/navigation.js
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // 햄버거 메뉴 토글
    navToggle?.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu?.classList.toggle('active');
    });

    // 스크롤 시 네비게이션 바 스타일 변경
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            navbar?.classList.remove('scroll-up');
            navbar?.classList.remove('scroll-down');
            return;
        }

        if (currentScroll > lastScroll && !navbar?.classList.contains('scroll-down')) {
            // 아래로 스크롤
            navbar?.classList.remove('scroll-up');
            navbar?.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && navbar?.classList.contains('scroll-down')) {
            // 위로 스크롤
            navbar?.classList.remove('scroll-down');
            navbar?.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // 반응형 메뉴 아이템 클릭 시 메뉴 닫기
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                navToggle?.classList.remove('active');
                navMenu?.classList.remove('active');
            }
        });
    });

    // 현재 페이지 네비게이션 링크 활성화
    const currentPage = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
});