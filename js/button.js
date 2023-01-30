'use strict';
// Função para dar o scroll Up da pagina

const buttonscrollTop = document.querySelector('.linktoTop');
// Seleciona a tag footer como target do botão, onde ele deve aparecer
const target = document.querySelector('footer');
const elementRoot = document.documentElement;

// Função para remover e adicionar a visibilidade do botão

const buttonFunction = (entries, observer) => {
  entries.forEach((entry) => {
    (entry.isIntersecting)
      ? buttonscrollTop.classList.add('notHidden')
      : buttonscrollTop.classList.remove('notHidden');
  });
};

// Compartamento de scrolling do botão conforme a tela
const scrollBehavior = () => {
    elementRoot.scrollTo({
        top:0,
        behavior:'smooth'
    });     
};

// Função de evento de clique, é uma callback function
buttonscrollTop.addEventListener('click',scrollBehavior);

let observer = new IntersectionObserver(buttonFunction);

observer.observe(target);

