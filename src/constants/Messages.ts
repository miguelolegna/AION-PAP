// src/constants/Messages.ts

export const SystemMessages = {
  auth: {
    loginSuccess: "Entraste com sucesso. Bem-vindo de volta!",
    registerSuccess: "A tua conta AION foi criada. Já podes começar!",
    logoutConfirm: "Tens a certeza que queres sair?",
    invalidEmail: "O email que inseriste não é válido. Verifica-o, por favor.",
    wrongPassword: "A password está incorreta. Tenta novamente.",
    weakPassword: "A tua password deve ter, pelo menos, 6 caracteres.",
    emailInUse: "Este email já está registado. Tenta recuperar a password.",
  },
  charger: {
    addSuccess: "O teu carregador foi registado com sucesso.",
    addError: "Não conseguimos registar o teu carregador. Tenta mais tarde.",
    locationRequired: "Precisamos que seleciones uma localização no mapa.",
    guestRestriction: "Precisas de entrar na tua conta para adicionar um carregador.",
  },
  general: {
    errorTitle: "Ocorreu um erro",
    connectionError: "Verifica a tua ligação à internet.",
    loading: "A carregar...",
  }
};