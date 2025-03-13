// Telegram Mini App integration utilities

// Type definitions for Telegram WebApp
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        initData: string;
        initDataUnsafe: any;
        version: string;
        platform: string;
        colorScheme: string;
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
          secondary_bg_color: string;
        };
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
      };
    };
  }
}

// Check if the app is running inside Telegram
export const isTelegramWebApp = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.Telegram?.WebApp);
};

// Initialize Telegram WebApp
export const initTelegramWebApp = (callback: () => void): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.ready();
    callback();
  }
};

// Get theme parameters from Telegram
export const getTelegramTheme = () => {
  if (!isTelegramWebApp()) {
    return {
      bgColor: '#1e1e1e',
      textColor: '#ffffff',
      buttonColor: '#50a8eb',
      buttonTextColor: '#ffffff',
    };
  }
  
  const { themeParams } = window.Telegram.WebApp;
  
  return {
    bgColor: themeParams.bg_color,
    textColor: themeParams.text_color,
    buttonColor: themeParams.button_color,
    buttonTextColor: themeParams.button_text_color,
  };
};

// Show main button in Telegram WebApp
export const showMainButton = (text: string, callback: () => void): void => {
  if (isTelegramWebApp()) {
    const mainButton = window.Telegram.WebApp.MainButton;
    mainButton.setText(text);
    mainButton.onClick(callback);
    mainButton.show();
  }
};

// Hide main button in Telegram WebApp
export const hideMainButton = (): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.MainButton.hide();
  }
};

// Send data back to the Telegram bot
export const sendDataToBot = (data: any): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.sendData(JSON.stringify(data));
  }
};

// Show alert in Telegram WebApp
export const showAlert = (message: string, callback?: () => void): void => {
  if (isTelegramWebApp()) {
    window.Telegram.WebApp.showAlert(message, callback);
  } else {
    alert(message);
    if (callback) callback();
  }
};
