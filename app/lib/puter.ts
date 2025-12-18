import { create } from "zustand";

declare global {
  interface Window {
    puter: {
      auth: {
        getUser: () => Promise<PuterUser>;
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
      fs: {
        write: (
          path: string,
          data: string | File | Blob
        ) => Promise<File | undefined>;
        read: (path: string) => Promise<Blob>;
        upload: (file: File[] | Blob[]) => Promise<FSItem>;
        delete: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<FSItem[] | undefined>;
      };
      ai: {
        chat: (
          prompt: string | ChatMessage[],
          imageURL?: string | PuterChatOptions,
          testMode?: boolean,
          options?: PuterChatOptions
        ) => Promise<Object>;
        img2txt: (
          image: string | File | Blob,
          testMode?: boolean
        ) => Promise<string>;
      };
      kv: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
        list: (pattern: string, returnValues?: boolean) => Promise<string[]>;
        flush: () => Promise<boolean>;
      };
    };
  }
}

interface PuterStore {
  isLoading: boolean;
  error: string | null;
  puterReady: boolean;
  auth: {
    user: PuterUser | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    getUser: () => PuterUser | null;
  };
  fs: {
    write: (
      path: string,
      data: string | File | Blob
    ) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };
  ai: {
    chat: (
      prompt: string | ChatMessage[],
      imageURL?: string | PuterChatOptions,
      testMode?: boolean,
      options?: PuterChatOptions
    ) => Promise<AIResponse | undefined>;
    feedback: (
      path: string,
      message: string
    ) => Promise<AIResponse | undefined>;
    img2txt: (
      image: string | File | Blob,
      testMode?: boolean
    ) => Promise<string | undefined>;
  };
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (
      pattern: string,
      returnValues?: boolean
    ) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };

  init: () => void;
  clearError: () => void;
}

const getPuter = (): typeof window.puter | null =>
  typeof window !== "undefined" && window.puter ? window.puter : null;

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => {
    set({
      error: msg,
      isLoading: false,
      auth: {
        user: null,
        isAuthenticated: false,
        signIn: get().auth.signIn,
        signOut: get().auth.signOut,
        refreshUser: get().auth.refreshUser,
        checkAuthStatus: get().auth.checkAuthStatus,
        getUser: get().auth.getUser,
      },
    });
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        set({
          auth: {
            user,
            isAuthenticated: true,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => user,
          },
          isLoading: false,
        });
        return true;
      } else {
        set({
          auth: {
            user: null,
            isAuthenticated: false,
            signIn: get().auth.signIn,
            signOut: get().auth.signOut,
            refreshUser: get().auth.refreshUser,
            checkAuthStatus: get().auth.checkAuthStatus,
            getUser: () => null,
          },
          isLoading: false,
        });
        return false;
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Falla al revisar el estatus de autorización";
      setError(msg);
      return false;
    }
  };

  const signIn = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signIn();
      await checkAuthStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Inicio de sesión fallido";
      setError(msg);
    }
  };

  const signOut = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signOut();
      set({
        auth: {
          user: null,
          isAuthenticated: false,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => null,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Cierre de sesión fallido";
      setError(msg);
    }
  };

  const refreshUser = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const user = await puter.auth.getUser();
      set({
        auth: {
          user,
          isAuthenticated: true,
          signIn: get().auth.signIn,
          signOut: get().auth.signOut,
          refreshUser: get().auth.refreshUser,
          checkAuthStatus: get().auth.checkAuthStatus,
          getUser: () => user,
        },
        isLoading: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el usuario:";
      setError(msg);
    }
  };

  const init = (): void => {
    const puter = getPuter();
    if (puter) {
      set({ puterReady: true });
      checkAuthStatus();
      return;
    }

    const interval = setInterval(() => {
      if (getPuter()) {
        clearInterval(interval);
        set({ puterReady: true });
        checkAuthStatus();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (!getPuter()) {
        setError("Puter.js no se pudo cargar en 10 segundos");
      }
    }, 10000);
  };

  const write = async (path: string, data: string | File | Blob) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.fs.write(path, data);
  };

  const readDir = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.fs.readdir(path);
  };

  const readFile = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.fs.read(path);
  };

  const upload = async (files: File[] | Blob[]) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.fs.upload(files);
  };

  const deleteFile = async (path: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.fs.delete(path);
  };

  const chat = async (
    prompt: string | ChatMessage[],
    imageURL?: string | PuterChatOptions,
    testMode?: boolean,
    options?: PuterChatOptions
  ) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    // return puter.ai.chat(prompt, imageURL, testMode, options);
    return puter.ai.chat(prompt, imageURL, testMode, options) as Promise<
      AIResponse | undefined
    >;
  };

  const feedback = async (path: string, message: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }

    return puter.ai.chat(
      [
        {
          role: "user",
          content: [
            {
              type: "file",
              puter_path: path,
            },
            {
              type: "text",
              text: message,
            },
          ],
        },
      ],
      { model: "claude-3-7-sonnet-latest" }  // claude-sonnet-4
    ) as Promise<AIResponse | undefined>;
  };

  /*
    Models:
    claude-opus-4-5-20251101,
    claude-opus-4-5-latest,
    claude-opus-4-5,
    claude-opus-4.5,
    claude-haiku-4-5-20251001,
    claude-haiku-4.5, claude-haiku-4-5, claude-4-5-haiku,
    claude-sonnet-4-5-20250929, claude-sonnet-4.5, claude-sonnet-4-5,
    claude-opus-4-1-20250805, claude-opus-4-1, claude-opus-4-20250514, claude-opus-4, claude-opus-4-latest,
    claude-sonnet-4-20250514, claude-sonnet-4, claude-sonnet-4-latest, claude-3-7-sonnet-20250219, claude-3-7-sonnet-latest, claude-3-5-sonnet-20241022, claude-3-5-sonnet-latest, claude-3-5-sonnet-20240620, claude-3-haiku-20240307, gpt-5.2-chat-latest, gpt-5.2-chat, gpt-5.2-pro-2025-12-11, gpt-5.2-pro, gpt-5.2-2025-12-11, gpt-5.2, gpt-5.1, gpt-5.1-codex, gpt-5.1-codex-mini, gpt-5.1-chat-latest, gpt-5-2025-08-07, gpt-5, gpt-5-mini-2025-08-07, gpt-5-mini, gpt-5-nano-2025-08-07, gpt-5-nano, gpt-5-chat-latest, gpt-4o, gpt-4o-mini, o1, o1-mini, o1-pro, o3, o3-mini, o4-mini, gpt-4.1, gpt-4.1-mini, gpt-4.1-nano, gpt-4.5-preview, gemini-2.0-flash, gemini-2.0-flash-lite, gemini-2.5-flash, gemini-2.5-flash-lite, gemini-2.5-pro, gemini-3-pro-preview, gemini-3-flash-preview, deepseek-chat, deepseek-reasoner, mistral-medium-2508, mistral-medium-latest, mistral-medium, open-mistral-7b, mistral-tiny, mistral-tiny-2312, open-mistral-nemo, open-mistral-nemo-2407, mistral-tiny-2407, mistral-tiny-latest, pixtral-large-2411, pixtral-large-latest, mistral-large-pixtral-2411, codestral-2508, codestral-latest, devstral-small-2507, devstral-small-latest, devstral-medium-2507, devstral-medium-latest, mistral-small-2506, mistral-small-latest, magistral-medium-2509, magistral-medium-latest, magistral-small-2509, magistral-small-latest, voxtral-mini-2507, voxtral-mini-latest, voxtral-small-2507, voxtral-small-latest, mistral-large-latest, mistral-large-2512, ministral-3b-2512, ministral-3b-latest, ministral-8b-2512, ministral-8b-latest, ministral-14b-2512, ministral-14b-latest, grok-beta, grok-vision-beta, grok-3, grok-3-fast, grok-3-mini, grok-3-mini-fast, grok-2-vision, grok-2, togetherai:togethercomputer/refuel-llm-v2, togethercomputer/refuel-llm-v2, togetherai/togethercomputer/refuel-llm-v2, refuel-llm-v2, togetherai:meta-llama/llama-guard-7b, meta-llama/llama-guard-7b, togetherai/meta-llama/llama-guard-7b, llama-guard-7b, togetherai:togethercomputer/moa-1, togethercomputer/moa-1, togetherai/togethercomputer/moa-1, moa-1, togetherai:meta-llama/llama-3.3-70b-instruct-turbo, meta-llama/llama-3.3-70b-instruct-turbo, togetherai/meta-llama/llama-3.3-70b-instruct-turbo, llama-3.3-70b-instruct-turbo, togetherai:marin-community/marin-8b-instruct, marin-community/marin-8b-instruct, togetherai/marin-community/marin-8b-instruct, marin-8b-instruct, togetherai:meta-llama/llama-guard-3-11b-vision-turbo, meta-llama/llama-guard-3-11b-vision-turbo, togetherai/meta-llama/llama-guard-3-11b-vision-turbo, llama-guard-3-11b-vision-turbo, togetherai:deepseek-ai/deepseek-r1, deepseek-ai/deepseek-r1, togetherai/deepseek-ai/deepseek-r1, deepseek-r1, togetherai:meta-llama/meta-llama-3.1-70b-instruct-turbo, meta-llama/meta-llama-3.1-70b-instruct-turbo, togetherai/meta-llama/meta-llama-3.1-70b-instruct-turbo, meta-llama-3.1-70b-instruct-turbo, togetherai:togethercomputer/moa-1-turbo, togethercomputer/moa-1-turbo, togetherai/togethercomputer/moa-1-turbo, moa-1-turbo, togetherai:deepcogito/cogito-v2-preview-llama-405b, deepcogito/cogito-v2-preview-llama-405b, togetherai/deepcogito/cogito-v2-preview-llama-405b, cogito-v2-preview-llama-405b, togetherai:deepcogito/cogito-v2-preview-llama-70b, deepcogito/cogito-v2-preview-llama-70b, togetherai/deepcogito/cogito-v2-preview-llama-70b, cogito-v2-preview-llama-70b, togetherai:arcee-ai/trinity-mini, arcee-ai/trinity-mini, togetherai/arcee-ai/trinity-mini, trinity-mini, togetherai:deepseek-ai/deepseek-r1-0528-tput, deepseek-ai/deepseek-r1-0528-tput, togetherai/deepseek-ai/deepseek-r1-0528-tput, deepseek-r1-0528-tput, togetherai:meta-llama/llama-4-maverick-17b-128e-instruct-fp8, meta-llama/llama-4-maverick-17b-128e-instruct-fp8, togetherai/meta-llama/llama-4-maverick-17b-128e-instruct-fp8, llama-4-maverick-17b-128e-instruct-fp8, togetherai:moonshotai/kimi-k2-thinking, moonshotai/kimi-k2-thinking, togetherai/moonshotai/kimi-k2-thinking, kimi-k2-thinking, togetherai:servicenow-ai/apriel-1.5-15b-thinker, servicenow-ai/apriel-1.5-15b-thinker, togetherai/servicenow-ai/apriel-1.5-15b-thinker, apriel-1.5-15b-thinker, togetherai:scb10x/scb10x-typhoon-2-1-gemma3-12b, scb10x/scb10x-typhoon-2-1-gemma3-12b, togetherai/scb10x/scb10x-typhoon-2-1-gemma3-12b, scb10x-typhoon-2-1-gemma3-12b, togetherai:meta-llama/llama-guard-4-12b, meta-llama/llama-guard-4-12b, togetherai/meta-llama/llama-guard-4-12b, llama-guard-4-12b, togetherai:meta-llama/llamaguard-2-8b, meta-llama/llamaguard-2-8b, togetherai/meta-llama/llamaguard-2-8b, llamaguard-2-8b, togetherai:meta-llama/llama-4-scout-17b-16e-instruct, meta-llama/llama-4-scout-17b-16e-instruct, togetherai/meta-llama/llama-4-scout-17b-16e-instruct, llama-4-scout-17b-16e-instruct, togetherai:meta-llama/meta-llama-3.1-8b-instruct-turbo, meta-llama/meta-llama-3.1-8b-instruct-turbo, togetherai/meta-llama/meta-llama-3.1-8b-instruct-turbo, meta-llama-3.1-8b-instruct-turbo, togetherai:meta-llama/meta-llama-3.1-405b-instruct-lite-pro, meta-llama/meta-llama-3.1-405b-instruct-lite-pro, togetherai/meta-llama/meta-llama-3.1-405b-instruct-lite-pro, meta-llama-3.1-405b-instruct-lite-pro, togetherai:meta-llama/llama-3.2-3b-instruct-turbo, meta-llama/llama-3.2-3b-instruct-turbo, togetherai/meta-llama/llama-3.2-3b-instruct-turbo, llama-3.2-3b-instruct-turbo, togetherai:qwen/qwen2.5-vl-72b-instruct, qwen/qwen2.5-vl-72b-instruct, togetherai/qwen/qwen2.5-vl-72b-instruct, qwen2.5-vl-72b-instruct, togetherai:zai-org/glm-4.5-air-fp8, zai-org/glm-4.5-air-fp8, togetherai/zai-org/glm-4.5-air-fp8, glm-4.5-air-fp8, togetherai:meta-llama/meta-llama-3-70b-instruct-turbo, meta-llama/meta-llama-3-70b-instruct-turbo, togetherai/meta-llama/meta-llama-3-70b-instruct-turbo, meta-llama-3-70b-instruct-turbo, togetherai:qwen/qwen3-coder-480b-a35b-instruct-fp8, qwen/qwen3-coder-480b-a35b-instruct-fp8, togetherai/qwen/qwen3-coder-480b-a35b-instruct-fp8, qwen3-coder-480b-a35b-instruct-fp8, togetherai:mistralai/mixtral-8x7b-instruct-v0.1, mistralai/mixtral-8x7b-instruct-v0.1, togetherai/mistralai/mixtral-8x7b-instruct-v0.1, mixtral-8x7b-instruct-v0.1, togetherai:openai/gpt-oss-120b, openai/gpt-oss-120b, togetherai/openai/gpt-oss-120b, gpt-oss-120b, togetherai:mistralai/mistral-7b-instruct-v0.3, mistralai/mistral-7b-instruct-v0.3, togetherai/mistralai/mistral-7b-instruct-v0.3, mistral-7b-instruct-v0.3, togetherai:virtue-ai/virtueguard-text-lite, virtue-ai/virtueguard-text-lite, togetherai/virtue-ai/virtueguard-text-lite, virtueguard-text-lite, togetherai:meta-llama/meta-llama-3-8b-instruct-lite, meta-llama/meta-llama-3-8b-instruct-lite, togetherai/meta-llama/meta-llama-3-8b-instruct-lite, meta-llama-3-8b-instruct-lite, togetherai:qwen/qwen3-235b-a22b-fp8-tput, qwen/qwen3-235b-a22b-fp8-tput, togetherai/qwen/qwen3-235b-a22b-fp8-tput, qwen3-235b-a22b-fp8-tput, togetherai:togethercomputer/refuel-llm-v2-small, togethercomputer/refuel-llm-v2-small, togetherai/togethercomputer/refuel-llm-v2-small, refuel-llm-v2-small, togetherai:arize-ai/qwen-2-1.5b-instruct, arize-ai/qwen-2-1.5b-instruct, togetherai/arize-ai/qwen-2-1.5b-instruct, qwen-2-1.5b-instruct, togetherai:deepseek-ai/deepseek-r1-distill-llama-70b, deepseek-ai/deepseek-r1-distill-llama-70b, togetherai/deepseek-ai/deepseek-r1-distill-llama-70b, deepseek-r1-distill-llama-70b, togetherai:qwen/qwen3-next-80b-a3b-thinking, qwen/qwen3-next-80b-a3b-thinking, togetherai/qwen/qwen3-next-80b-a3b-thinking, qwen3-next-80b-a3b-thinking, togetherai:qwen/qwen2.5-72b-instruct-turbo, qwen/qwen2.5-72b-instruct-turbo, togetherai/qwen/qwen2.5-72b-instruct-turbo, qwen2.5-72b-instruct-turbo, togetherai:qwen/qwen3-next-80b-a3b-instruct, qwen/qwen3-next-80b-a3b-instruct, togetherai/qwen/qwen3-next-80b-a3b-instruct, qwen3-next-80b-a3b-instruct, togetherai:moonshotai/kimi-k2-instruct-0905, moonshotai/kimi-k2-instruct-0905, togetherai/moonshotai/kimi-k2-instruct-0905, kimi-k2-instruct-0905, togetherai:qwen/qwen2.5-7b-instruct-turbo, qwen/qwen2.5-7b-instruct-turbo, togetherai/qwen/qwen2.5-7b-instruct-turbo, qwen2.5-7b-instruct-turbo, togetherai:deepcogito/cogito-v2-preview-llama-109b-moe, deepcogito/cogito-v2-preview-llama-109b-moe, togetherai/deepcogito/cogito-v2-preview-llama-109b-moe, cogito-v2-preview-llama-109b-moe, togetherai:mercor/cwm, mercor/cwm, togetherai/mercor/cwm, cwm, togetherai:deepseek-ai/deepseek-v3, deepseek-ai/deepseek-v3, togetherai/deepseek-ai/deepseek-v3, deepseek-v3, togetherai:essentialai/rnj-1-instruct, essentialai/rnj-1-instruct, togetherai/essentialai/rnj-1-instruct, rnj-1-instruct, togetherai:qwen/qwen3-vl-32b-instruct, qwen/qwen3-vl-32b-instruct, togetherai/qwen/qwen3-vl-32b-instruct, qwen3-vl-32b-instruct, togetherai:mistralai/ministral-3-14b-instruct-2512, mistralai/ministral-3-14b-instruct-2512, togetherai/mistralai/ministral-3-14b-instruct-2512, ministral-3-14b-instruct-2512, togetherai:qwen/qwen3-235b-a22b-instruct-2507-tput, qwen/qwen3-235b-a22b-instruct-2507-tput, togetherai/qwen/qwen3-235b-a22b-instruct-2507-tput, qwen3-235b-a22b-instruct-2507-tput, togetherai:meta-llama/meta-llama-3.1-405b-instruct-turbo, meta-llama/meta-llama-3.1-405b-instruct-turbo, togetherai/meta-llama/meta-llama-3.1-405b-instruct-turbo, meta-llama-3.1-405b-instruct-turbo, togetherai:zai-org/glm-4.6, zai-org/glm-4.6, togetherai/zai-org/glm-4.6, glm-4.6, togetherai:google/gemma-3n-e4b-it, google/gemma-3n-e4b-it, togetherai/google/gemma-3n-e4b-it, gemma-3n-e4b-it, togetherai:qwen/qwen3-vl-8b-instruct, qwen/qwen3-vl-8b-instruct, togetherai/qwen/qwen3-vl-8b-instruct, qwen3-vl-8b-instruct, togetherai:meta-llama/llama-3-70b-chat-hf, meta-llama/llama-3-70b-chat-hf, togetherai/meta-llama/llama-3-70b-chat-hf, llama-3-70b-chat-hf, togetherai:meta-llama/meta-llama-guard-3-8b, meta-llama/meta-llama-guard-3-8b, togetherai/meta-llama/meta-llama-guard-3-8b, meta-llama-guard-3-8b, togetherai:servicenow-ai/apriel-1.6-15b-thinker, servicenow-ai/apriel-1.6-15b-thinker, togetherai/servicenow-ai/apriel-1.6-15b-thinker, apriel-1.6-15b-thinker, togetherai:deepcogito/cogito-v2-1-671b, deepcogito/cogito-v2-1-671b, togetherai/deepcogito/cogito-v2-1-671b, cogito-v2-1-671b, togetherai:mistralai/mistral-small-24b-instruct-2501, mistralai/mistral-small-24b-instruct-2501, togetherai/mistralai/mistral-small-24b-instruct-2501, mistral-small-24b-instruct-2501, togetherai:nvidia/nvidia-nemotron-nano-9b-v2, nvidia/nvidia-nemotron-nano-9b-v2, togetherai/nvidia/nvidia-nemotron-nano-9b-v2, nvidia-nemotron-nano-9b-v2, togetherai:meta-llama/llama-3.1-405b-instruct, meta-llama/llama-3.1-405b-instruct, togetherai/meta-llama/llama-3.1-405b-instruct, llama-3.1-405b-instruct, togetherai:meta-llama/llama-3-70b-hf, meta-llama/llama-3-70b-hf, togetherai/meta-llama/llama-3-70b-hf, llama-3-70b-hf, togetherai:qwen/qwen3-235b-a22b-thinking-2507, qwen/qwen3-235b-a22b-thinking-2507, togetherai/qwen/qwen3-235b-a22b-thinking-2507, qwen3-235b-a22b-thinking-2507, togetherai:meta-llama/meta-llama-3.1-70b-instruct-reference, meta-llama/meta-llama-3.1-70b-instruct-reference, togetherai/meta-llama/meta-llama-3.1-70b-instruct-reference, meta-llama-3.1-70b-instruct-reference, togetherai:meta-llama/llama-3.2-1b-instruct, meta-llama/llama-3.2-1b-instruct, togetherai/meta-llama/llama-3.2-1b-instruct, llama-3.2-1b-instruct, togetherai:qwen/qwen2.5-14b-instruct, qwen/qwen2.5-14b-instruct, togetherai/qwen/qwen2.5-14b-instruct, qwen2.5-14b-instruct, togetherai:meta-llama/meta-llama-3.1-8b-instruct-reference, meta-llama/meta-llama-3.1-8b-instruct-reference, togetherai/meta-llama/meta-llama-3.1-8b-instruct-reference, meta-llama-3.1-8b-instruct-reference, togetherai:meta-llama/meta-llama-3-8b-instruct, meta-llama/meta-llama-3-8b-instruct, togetherai/meta-llama/meta-llama-3-8b-instruct, meta-llama-3-8b-instruct, togetherai:mistralai/mistral-7b-instruct-v0.2, mistralai/mistral-7b-instruct-v0.2, togetherai/mistralai/mistral-7b-instruct-v0.2, mistral-7b-instruct-v0.2, togetherai:openai/gpt-oss-20b, openai/gpt-oss-20b, togetherai/openai/gpt-oss-20b, gpt-oss-20b, togetherai:deepseek-ai/deepseek-v3.1, deepseek-ai/deepseek-v3.1, togetherai/deepseek-ai/deepseek-v3.1, deepseek-v3.1, togetherai:qwen/qwen2.5-72b-instruct, qwen/qwen2.5-72b-instruct, togetherai/qwen/qwen2.5-72b-instruct, qwen2.5-72b-instruct, model-fallback-test-1, openrouter:google/gemini-3-flash-preview, google/gemini-3-flash-preview, google: gemini 3 flash preview, openrouter/google/gemini-3-flash-preview, openrouter:mistralai/mistral-small-creative, mistralai/mistral-small-creative, mistral: mistral small creative, openrouter/mistralai/mistral-small-creative, mistral-small-creative, openrouter:allenai/olmo-3.1-32b-think:free, allenai/olmo-3.1-32b-think:free, allenai: olmo 3.1 32b think (free), openrouter/allenai/olmo-3.1-32b-think:free, olmo-3.1-32b-think:free, openrouter:xiaomi/mimo-v2-flash:free, xiaomi/mimo-v2-flash:free, xiaomi: mimo-v2-flash (free), openrouter/xiaomi/mimo-v2-flash:free, mimo-v2-flash:free, openrouter:nvidia/nemotron-3-nano-30b-a3b:free, nvidia/nemotron-3-nano-30b-a3b:free, nvidia: nemotron 3 nano 30b a3b (free), openrouter/nvidia/nemotron-3-nano-30b-a3b:free, nemotron-3-nano-30b-a3b:free, openrouter:openai/gpt-5.2-chat, openai/gpt-5.2-chat, openai: gpt-5.2 chat, openrouter/openai/gpt-5.2-chat, openrouter:openai/gpt-5.2-pro, openai/gpt-5.2-pro, openai: gpt-5.2 pro, openrouter/openai/gpt-5.2-pro, openrouter:openai/gpt-5.2, openai/gpt-5.2, openai: gpt-5.2, openrouter/openai/gpt-5.2, openrouter:mistralai/devstral-2512:free, mistralai/devstral-2512:free, mistral: devstral 2 2512 (free), openrouter/mistralai/devstral-2512:free, devstral-2512:free, openrouter:mistralai/devstral-2512, mistralai/devstral-2512, mistral: devstral 2 2512, openrouter/mistralai/devstral-2512, devstral-2512, openrouter:relace/relace-search, relace/relace-search, relace: relace search, openrouter/relace/relace-search, relace-search, openrouter:z-ai/glm-4.6v, z-ai/glm-4.6v, z.ai: glm 4.6v, openrouter/z-ai/glm-4.6v, glm-4.6v, openrouter:nex-agi/deepseek-v3.1-nex-n1:free, nex-agi/deepseek-v3.1-nex-n1:free, nex agi: deepseek v3.1 nex n1 (free), openrouter/nex-agi/deepseek-v3.1-nex-n1:free, deepseek-v3.1-nex-n1:free, openrouter:essentialai/rnj-1-instruct, essentialai: rnj 1 instruct, openrouter/essentialai/rnj-1-instruct, openrouter:openrouter/bodybuilder, openrouter/bodybuilder, body builder (beta), openrouter/openrouter/bodybuilder, bodybuilder, openrouter:openai/gpt-5.1-codex-max, openai/gpt-5.1-codex-max, openai: gpt-5.1-codex-max, openrouter/openai/gpt-5.1-codex-max, gpt-5.1-codex-max, openrouter:amazon/nova-2-lite-v1, amazon/nova-2-lite-v1, amazon: nova 2 lite, openrouter/amazon/nova-2-lite-v1, nova-2-lite-v1, openrouter:mistralai/ministral-14b-2512, mistralai/ministral-14b-2512, mistral: ministral 3 14b 2512, openrouter/mistralai/ministral-14b-2512, openrouter:mistralai/ministral-8b-2512, mistralai/ministral-8b-2512, mistral: ministral 3 8b 2512, openrouter/mistralai/ministral-8b-2512, openrouter:mistralai/ministral-3b-2512, mistralai/ministral-3b-2512, mistral: ministral 3 3b 2512, openrouter/mistralai/ministral-3b-2512, openrouter:mistralai/mistral-large-2512, mistralai/mistral-large-2512, mistral: mistral large 3 2512, openrouter/mistralai/mistral-large-2512, openrouter:arcee-ai/trinity-mini:free, arcee-ai/trinity-mini:free, arcee ai: trinity mini (free), openrouter/arcee-ai/trinity-mini:free, trinity-mini:free, openrouter:arcee-ai/trinity-mini, arcee ai: trinity mini, openrouter/arcee-ai/trinity-mini, openrouter:deepseek/deepseek-v3.2-speciale, deepseek/deepseek-v3.2-speciale, deepseek: deepseek v3.2 speciale, openrouter/deepseek/deepseek-v3.2-speciale, deepseek-v3.2-speciale, openrouter:deepseek/deepseek-v3.2, deepseek/deepseek-v3.2, deepseek: deepseek v3.2, openrouter/deepseek/deepseek-v3.2, deepseek-v3.2, openrouter:prime-intellect/intellect-3, prime-intellect/intellect-3, prime intellect: intellect-3, openrouter/prime-intellect/intellect-3, intellect-3, openrouter:tngtech/tng-r1t-chimera:free, tngtech/tng-r1t-chimera:free, tng: r1t chimera (free), openrouter/tngtech/tng-r1t-chimera:free, tng-r1t-chimera:free, openrouter:tngtech/tng-r1t-chimera, tngtech/tng-r1t-chimera, tng: r1t chimera, openrouter/tngtech/tng-r1t-chimera, tng-r1t-chimera, openrouter:anthropic/claude-opus-4.5, anthropic/claude-opus-4.5, anthropic: claude opus 4.5, openrouter/anthropic/claude-opus-4.5, openrouter:allenai/olmo-3-32b-think:free, allenai/olmo-3-32b-think:free, allenai: olmo 3 32b think (free), openrouter/allenai/olmo-3-32b-think:free, olmo-3-32b-think:free, openrouter:allenai/olmo-3-7b-instruct, allenai/olmo-3-7b-instruct, allenai: olmo 3 7b instruct, openrouter/allenai/olmo-3-7b-instruct, olmo-3-7b-instruct, openrouter:allenai/olmo-3-7b-think, allenai/olmo-3-7b-think, allenai: olmo 3 7b think, openrouter/allenai/olmo-3-7b-think, olmo-3-7b-think, openrouter:google/gemini-3-pro-image-preview, google/gemini-3-pro-image-preview, google: nano banana pro (gemini 3 pro image preview), openrouter/google/gemini-3-pro-image-preview, gemini-3-pro-image-preview, openrouter:x-ai/grok-4.1-fast, x-ai/grok-4.1-fast, xai: grok 4.1 fast, openrouter/x-ai/grok-4.1-fast, grok-4.1-fast, openrouter:google/gemini-3-pro-preview, google/gemini-3-pro-preview, google: gemini 3 pro preview, openrouter/google/gemini-3-pro-preview, openrouter:deepcogito/cogito-v2.1-671b, deepcogito/cogito-v2.1-671b, deep cogito: cogito v2.1 671b, openrouter/deepcogito/cogito-v2.1-671b, cogito-v2.1-671b, openrouter:openai/gpt-5.1, openai/gpt-5.1, openai: gpt-5.1, openrouter/openai/gpt-5.1, openrouter:openai/gpt-5.1-chat, openai/gpt-5.1-chat, openai: gpt-5.1 chat, openrouter/openai/gpt-5.1-chat, gpt-5.1-chat, openrouter:openai/gpt-5.1-codex, openai/gpt-5.1-codex, openai: gpt-5.1-codex, openrouter/openai/gpt-5.1-codex, openrouter:openai/gpt-5.1-codex-mini, openai/gpt-5.1-codex-mini, openai: gpt-5.1-codex-mini, openrouter/openai/gpt-5.1-codex-mini, openrouter:kwaipilot/kat-coder-pro:free, kwaipilot/kat-coder-pro:free, kwaipilot: kat-coder-pro v1 (free), openrouter/kwaipilot/kat-coder-pro:free, kat-coder-pro:free, openrouter:moonshotai/kimi-k2-thinking, moonshotai: kimi k2 thinking, openrouter/moonshotai/kimi-k2-thinking, openrouter:amazon/nova-premier-v1, amazon/nova-premier-v1, amazon: nova premier 1.0, openrouter/amazon/nova-premier-v1, nova-premier-v1, openrouter:perplexity/sonar-pro-search, perplexity/sonar-pro-search, perplexity: sonar pro search, openrouter/perplexity/sonar-pro-search, sonar-pro-search, openrouter:mistralai/voxtral-small-24b-2507, mistralai/voxtral-small-24b-2507, mistral: voxtral small 24b 2507, openrouter/mistralai/voxtral-small-24b-2507, voxtral-small-24b-2507, openrouter:openai/gpt-oss-safeguard-20b, openai/gpt-oss-safeguard-20b, openai: gpt-oss-safeguard-20b, openrouter/openai/gpt-oss-safeguard-20b, gpt-oss-safeguard-20b, openrouter:nvidia/nemotron-nano-12b-v2-vl:free, nvidia/nemotron-nano-12b-v2-vl:free, nvidia: nemotron nano 12b 2 vl (free), openrouter/nvidia/nemotron-nano-12b-v2-vl:free, nemotron-nano-12b-v2-vl:free, openrouter:nvidia/nemotron-nano-12b-v2-vl, nvidia/nemotron-nano-12b-v2-vl, nvidia: nemotron nano 12b 2 vl, openrouter/nvidia/nemotron-nano-12b-v2-vl, nemotron-nano-12b-v2-vl, openrouter:minimax/minimax-m2, minimax/minimax-m2, minimax: minimax m2, openrouter/minimax/minimax-m2, minimax-m2, openrouter:qwen/qwen3-vl-32b-instruct, qwen: qwen3 vl 32b instruct, openrouter/qwen/qwen3-vl-32b-instruct, openrouter:liquid/lfm2-8b-a1b, liquid/lfm2-8b-a1b, liquidai/lfm2-8b-a1b, openrouter/liquid/lfm2-8b-a1b, lfm2-8b-a1b, openrouter:liquid/lfm-2.2-6b, liquid/lfm-2.2-6b, liquidai/lfm2-2.6b, openrouter/liquid/lfm-2.2-6b, lfm-2.2-6b, openrouter:ibm-granite/granite-4.0-h-micro, ibm-granite/granite-4.0-h-micro, ibm: granite 4.0 micro, openrouter/ibm-granite/granite-4.0-h-micro, granite-4.0-h-micro, openrouter:deepcogito/cogito-v2-preview-llama-405b, deep cogito: cogito v2 preview llama 405b, openrouter/deepcogito/cogito-v2-preview-llama-405b, openrouter:openai/gpt-5-image-mini, openai/gpt-5-image-mini, openai: gpt-5 image mini, openrouter/openai/gpt-5-image-mini, gpt-5-image-mini, openrouter:anthropic/claude-haiku-4.5, anthropic/claude-haiku-4.5, anthropic: claude haiku 4.5, openrouter/anthropic/claude-haiku-4.5, openrouter:qwen/qwen3-vl-8b-thinking, qwen/qwen3-vl-8b-thinking, qwen: qwen3 vl 8b thinking, openrouter/qwen/qwen3-vl-8b-thinking, qwen3-vl-8b-thinking, openrouter:qwen/qwen3-vl-8b-instruct, qwen: qwen3 vl 8b instruct, openrouter/qwen/qwen3-vl-8b-instruct, openrouter:openai/gpt-5-image, openai/gpt-5-image, openai: gpt-5 image, openrouter/openai/gpt-5-image, gpt-5-image, openrouter:openai/o3-deep-research, openai/o3-deep-research, openai: o3 deep research, openrouter/openai/o3-deep-research, o3-deep-research, openrouter:openai/o4-mini-deep-research, openai/o4-mini-deep-research, openai: o4 mini deep research, openrouter/openai/o4-mini-deep-research, o4-mini-deep-research, openrouter:nvidia/llama-3.3-nemotron-super-49b-v1.5, nvidia/llama-3.3-nemotron-super-49b-v1.5, nvidia: llama 3.3 nemotron super 49b v1.5, openrouter/nvidia/llama-3.3-nemotron-super-49b-v1.5, llama-3.3-nemotron-super-49b-v1.5, openrouter:baidu/ernie-4.5-21b-a3b-thinking, baidu/ernie-4.5-21b-a3b-thinking, baidu: ernie 4.5 21b a3b thinking, openrouter/baidu/ernie-4.5-21b-a3b-thinking, ernie-4.5-21b-a3b-thinking, openrouter:google/gemini-2.5-flash-image, google/gemini-2.5-flash-image, google: gemini 2.5 flash image (nano banana), openrouter/google/gemini-2.5-flash-image, gemini-2.5-flash-image, openrouter:qwen/qwen3-vl-30b-a3b-thinking, qwen/qwen3-vl-30b-a3b-thinking, qwen: qwen3 vl 30b a3b thinking, openrouter/qwen/qwen3-vl-30b-a3b-thinking, qwen3-vl-30b-a3b-thinking, openrouter:qwen/qwen3-vl-30b-a3b-instruct, qwen/qwen3-vl-30b-a3b-instruct, qwen: qwen3 vl 30b a3b instruct, openrouter/qwen/qwen3-vl-30b-a3b-instruct, qwen3-vl-30b-a3b-instruct, openrouter:openai/gpt-5-pro, openai/gpt-5-pro, openai: gpt-5 pro, openrouter/openai/gpt-5-pro, gpt-5-pro, openrouter:z-ai/glm-4.6, z-ai/glm-4.6, z.ai: glm 4.6, openrouter/z-ai/glm-4.6, openrouter:z-ai/glm-4.6:exacto, z-ai/glm-4.6:exacto, z.ai: glm 4.6 (exacto), openrouter/z-ai/glm-4.6:exacto, glm-4.6:exacto, openrouter:anthropic/claude-sonnet-4.5, anthropic/claude-sonnet-4.5, anthropic: claude sonnet 4.5, openrouter/anthropic/claude-sonnet-4.5, openrouter:deepseek/deepseek-v3.2-exp, deepseek/deepseek-v3.2-exp, deepseek: deepseek v3.2 exp, openrouter/deepseek/deepseek-v3.2-exp, deepseek-v3.2-exp, openrouter:thedrummer/cydonia-24b-v4.1, thedrummer/cydonia-24b-v4.1, thedrummer: cydonia 24b v4.1, openrouter/thedrummer/cydonia-24b-v4.1, cydonia-24b-v4.1, openrouter:relace/relace-apply-3, relace/relace-apply-3, relace: relace apply 3, openrouter/relace/relace-apply-3, relace-apply-3, openrouter:google/gemini-2.5-flash-preview-09-2025, google/gemini-2.5-flash-preview-09-2025, google: gemini 2.5 flash preview 09-2025, openrouter/google/gemini-2.5-flash-preview-09-2025, gemini-2.5-flash-preview-09-2025, openrouter:google/gemini-2.5-flash-lite-preview-09-2025, google/gemini-2.5-flash-lite-preview-09-2025, google: gemini 2.5 flash lite preview 09-2025, openrouter/google/gemini-2.5-flash-lite-preview-09-2025, gemini-2.5-flash-lite-preview-09-2025, openrouter:qwen/qwen3-vl-235b-a22b-thinking, qwen/qwen3-vl-235b-a22b-thinking, qwen: qwen3 vl 235b a22b thinking, openrouter/qwen/qwen3-vl-235b-a22b-thinking, qwen3-vl-235b-a22b-thinking, openrouter:qwen/qwen3-vl-235b-a22b-instruct, qwen/qwen3-vl-235b-a22b-instruct, qwen: qwen3 vl 235b a22b instruct, openrouter/qwen/qwen3-vl-235b-a22b-instruct, qwen3-vl-235b-a22b-instruct, openrouter:qwen/qwen3-max, qwen/qwen3-max, qwen: qwen3 max, openrouter/qwen/qwen3-max, qwen3-max, openrouter:qwen/qwen3-coder-plus, qwen/qwen3-coder-plus, qwen: qwen3 coder plus, openrouter/qwen/qwen3-coder-plus, qwen3-coder-plus, openrouter:openai/gpt-5-codex, openai/gpt-5-codex, openai: gpt-5 codex, openrouter/openai/gpt-5-codex, gpt-5-codex, openrouter:deepseek/deepseek-v3.1-terminus:exacto, deepseek/deepseek-v3.1-terminus:exacto, deepseek: deepseek v3.1 terminus (exacto), openrouter/deepseek/deepseek-v3.1-terminus:exacto, deepseek-v3.1-terminus:exacto, openrouter:deepseek/deepseek-v3.1-terminus, deepseek/deepseek-v3.1-terminus, deepseek: deepseek v3.1 terminus, openrouter/deepseek/deepseek-v3.1-terminus, deepseek-v3.1-terminus, openrouter:x-ai/grok-4-fast, x-ai/grok-4-fast, xai: grok 4 fast, openrouter/x-ai/grok-4-fast, grok-4-fast, openrouter:alibaba/tongyi-deepresearch-30b-a3b:free, alibaba/tongyi-deepresearch-30b-a3b:free, tongyi deepresearch 30b a3b (free), openrouter/alibaba/tongyi-deepresearch-30b-a3b:free, tongyi-deepresearch-30b-a3b:free, openrouter:alibaba/tongyi-deepresearch-30b-a3b, alibaba/tongyi-deepresearch-30b-a3b, tongyi deepresearch 30b a3b, openrouter/alibaba/tongyi-deepresearch-30b-a3b, tongyi-deepresearch-30b-a3b, openrouter:qwen/qwen3-coder-flash, qwen/qwen3-coder-flash, qwen: qwen3 coder flash, openrouter/qwen/qwen3-coder-flash, qwen3-coder-flash, openrouter:opengvlab/internvl3-78b, opengvlab/internvl3-78b, opengvlab: internvl3 78b, openrouter/opengvlab/internvl3-78b, internvl3-78b, openrouter:qwen/qwen3-next-80b-a3b-thinking, qwen: qwen3 next 80b a3b thinking, openrouter/qwen/qwen3-next-80b-a3b-thinking, openrouter:qwen/qwen3-next-80b-a3b-instruct, qwen: qwen3 next 80b a3b instruct, openrouter/qwen/qwen3-next-80b-a3b-instruct, openrouter:meituan/longcat-flash-chat, meituan/longcat-flash-chat, meituan: longcat flash chat, openrouter/meituan/longcat-flash-chat, longcat-flash-chat, openrouter:qwen/qwen-plus-2025-07-28, qwen/qwen-plus-2025-07-28, qwen: qwen plus 0728, openrouter/qwen/qwen-plus-2025-07-28, qwen-plus-2025-07-28, openrouter:qwen/qwen-plus-2025-07-28:thinking, qwen/qwen-plus-2025-07-28:thinking, qwen: qwen plus 0728 (thinking), openrouter/qwen/qwen-plus-2025-07-28:thinking, qwen-plus-2025-07-28:thinking, openrouter:nvidia/nemotron-nano-9b-v2:free, nvidia/nemotron-nano-9b-v2:free, nvidia: nemotron nano 9b v2 (free), openrouter/nvidia/nemotron-nano-9b-v2:free, nemotron-nano-9b-v2:free, openrouter:nvidia/nemotron-nano-9b-v2, nvidia/nemotron-nano-9b-v2, nvidia: nemotron nano 9b v2, openrouter/nvidia/nemotron-nano-9b-v2, nemotron-nano-9b-v2, openrouter:moonshotai/kimi-k2-0905, moonshotai/kimi-k2-0905, moonshotai: kimi k2 0905, openrouter/moonshotai/kimi-k2-0905, kimi-k2-0905, openrouter:moonshotai/kimi-k2-0905:exacto, moonshotai/kimi-k2-0905:exacto, moonshotai: kimi k2 0905 (exacto), openrouter/moonshotai/kimi-k2-0905:exacto, kimi-k2-0905:exacto, openrouter:deepcogito/cogito-v2-preview-llama-70b, deep cogito: cogito v2 preview llama 70b, openrouter/deepcogito/cogito-v2-preview-llama-70b, openrouter:deepcogito/cogito-v2-preview-llama-109b-moe, cogito v2 preview llama 109b, openrouter/deepcogito/cogito-v2-preview-llama-109b-moe, openrouter:stepfun-ai/step3, stepfun-ai/step3, stepfun: step3, openrouter/stepfun-ai/step3, step3, openrouter:qwen/qwen3-30b-a3b-thinking-2507, qwen/qwen3-30b-a3b-thinking-2507, qwen: qwen3 30b a3b thinking 2507, openrouter/qwen/qwen3-30b-a3b-thinking-2507, qwen3-30b-a3b-thinking-2507, openrouter:x-ai/grok-code-fast-1, x-ai/grok-code-fast-1, xai: grok code fast 1, openrouter/x-ai/grok-code-fast-1, grok-code-fast-1, openrouter:nousresearch/hermes-4-70b, nousresearch/hermes-4-70b, nous: hermes 4 70b, openrouter/nousresearch/hermes-4-70b, hermes-4-70b, openrouter:nousresearch/hermes-4-405b, nousresearch/hermes-4-405b, nous: hermes 4 405b, openrouter/nousresearch/hermes-4-405b, hermes-4-405b, openrouter:google/gemini-2.5-flash-image-preview, google/gemini-2.5-flash-image-preview, google: gemini 2.5 flash image preview (nano banana), openrouter/google/gemini-2.5-flash-image-preview, gemini-2.5-flash-image-preview, openrouter:deepseek/deepseek-chat-v3.1, deepseek/deepseek-chat-v3.1, deepseek: deepseek v3.1, openrouter/deepseek/deepseek-chat-v3.1, deepseek-chat-v3.1, openrouter:openai/gpt-4o-audio-preview, openai/gpt-4o-audio-preview, openai: gpt-4o audio, openrouter/openai/gpt-4o-audio-preview, gpt-4o-audio-preview, openrouter:mistralai/mistral-medium-3.1, mistralai/mistral-medium-3.1, mistral: mistral medium 3.1, openrouter/mistralai/mistral-medium-3.1, mistral-medium-3.1, openrouter:baidu/ernie-4.5-21b-a3b, baidu/ernie-4.5-21b-a3b, baidu: ernie 4.5 21b a3b, openrouter/baidu/ernie-4.5-21b-a3b, ernie-4.5-21b-a3b, openrouter:baidu/ernie-4.5-vl-28b-a3b, baidu/ernie-4.5-vl-28b-a3b, baidu: ernie 4.5 vl 28b a3b, openrouter/baidu/ernie-4.5-vl-28b-a3b, ernie-4.5-vl-28b-a3b, openrouter:z-ai/glm-4.5v, z-ai/glm-4.5v, z.ai: glm 4.5v, openrouter/z-ai/glm-4.5v, glm-4.5v, openrouter:ai21/jamba-mini-1.7, ai21/jamba-mini-1.7, ai21: jamba mini 1.7, openrouter/ai21/jamba-mini-1.7, jamba-mini-1.7, openrouter:ai21/jamba-large-1.7, ai21/jamba-large-1.7, ai21: jamba large 1.7, openrouter/ai21/jamba-large-1.7, jamba-large-1.7, openrouter:openai/gpt-5-chat, openai/gpt-5-chat, openai: gpt-5 chat, openrouter/openai/gpt-5-chat, gpt-5-chat, openrouter:openai/gpt-5, openai/gpt-5, openai: gpt-5, openrouter/openai/gpt-5, openrouter:openai/gpt-5-mini, openai/gpt-5-mini, openai: gpt-5 mini, openrouter/openai/gpt-5-mini, openrouter:openai/gpt-5-nano, openai/gpt-5-nano, openai: gpt-5 nano, openrouter/openai/gpt-5-nano, openrouter:openai/gpt-oss-120b:free, openai/gpt-oss-120b:free, openai: gpt-oss-120b (free), openrouter/openai/gpt-oss-120b:free, gpt-oss-120b:free, openrouter:openai/gpt-oss-120b, openai: gpt-oss-120b, openrouter/openai/gpt-oss-120b, openrouter:openai/gpt-oss-120b:exacto, openai/gpt-oss-120b:exacto, openai: gpt-oss-120b (exacto), openrouter/openai/gpt-oss-120b:exacto, gpt-oss-120b:exacto, openrouter:openai/gpt-oss-20b:free, openai/gpt-oss-20b:free, openai: gpt-oss-20b (free), openrouter/openai/gpt-oss-20b:free, gpt-oss-20b:free, openrouter:openai/gpt-oss-20b, openai: gpt-oss-20b, openrouter/openai/gpt-oss-20b, openrouter:anthropic/claude-opus-4.1, anthropic/claude-opus-4.1, anthropic: claude opus 4.1, openrouter/anthropic/claude-opus-4.1, claude-opus-4.1, openrouter:mistralai/codestral-2508, mistralai/codestral-2508, mistral: codestral 2508, openrouter/mistralai/codestral-2508, openrouter:qwen/qwen3-coder-30b-a3b-instruct, qwen/qwen3-coder-30b-a3b-instruct, qwen: qwen3 coder 30b a3b instruct, openrouter/qwen/qwen3-coder-30b-a3b-instruct, qwen3-coder-30b-a3b-instruct, openrouter:qwen/qwen3-30b-a3b-instruct-2507, qwen/qwen3-30b-a3b-instruct-2507, qwen: qwen3 30b a3b instruct 2507, openrouter/qwen/qwen3-30b-a3b-instruct-2507, qwen3-30b-a3b-instruct-2507, openrouter:z-ai/glm-4.5, z-ai/glm-4.5, z.ai: glm 4.5, openrouter/z-ai/glm-4.5, glm-4.5, openrouter:z-ai/glm-4.5-air:free, z-ai/glm-4.5-air:free, z.ai: glm 4.5 air (free), openrouter/z-ai/glm-4.5-air:free, glm-4.5-air:free, openrouter:z-ai/glm-4.5-air, z-ai/glm-4.5-air, z.ai: glm 4.5 air, openrouter/z-ai/glm-4.5-air, glm-4.5-air, openrouter:qwen/qwen3-235b-a22b-thinking-2507, qwen: qwen3 235b a22b thinking 2507, openrouter/qwen/qwen3-235b-a22b-thinking-2507, openrouter:z-ai/glm-4-32b, z-ai/glm-4-32b, z.ai: glm 4 32b, openrouter/z-ai/glm-4-32b, glm-4-32b, openrouter:qwen/qwen3-coder:free, qwen/qwen3-coder:free, qwen: qwen3 coder 480b a35b (free), openrouter/qwen/qwen3-coder:free, qwen3-coder:free, openrouter:qwen/qwen3-coder, qwen/qwen3-coder, qwen: qwen3 coder 480b a35b, openrouter/qwen/qwen3-coder, qwen3-coder, openrouter:qwen/qwen3-coder:exacto, qwen/qwen3-coder:exacto, qwen: qwen3 coder 480b a35b (exacto), openrouter/qwen/qwen3-coder:exacto, qwen3-coder:exacto, openrouter:bytedance/ui-tars-1.5-7b, bytedance/ui-tars-1.5-7b, bytedance: ui-tars 7b, openrouter/bytedance/ui-tars-1.5-7b, ui-tars-1.5-7b, openrouter:google/gemini-2.5-flash-lite, google/gemini-2.5-flash-lite, google: gemini 2.5 flash lite, openrouter/google/gemini-2.5-flash-lite, openrouter:qwen/qwen3-235b-a22b-2507, qwen/qwen3-235b-a22b-2507, qwen: qwen3 235b a22b instruct 2507, openrouter/qwen/qwen3-235b-a22b-2507, qwen3-235b-a22b-2507, openrouter:switchpoint/router, switchpoint/router, switchpoint router, openrouter/switchpoint/router, router, openrouter:moonshotai/kimi-k2:free, moonshotai/kimi-k2:free, moonshotai: kimi k2 0711 (free), openrouter/moonshotai/kimi-k2:free, kimi-k2:free, openrouter:moonshotai/kimi-k2, moonshotai/kimi-k2, moonshotai: kimi k2 0711, openrouter/moonshotai/kimi-k2, kimi-k2, openrouter:thudm/glm-4.1v-9b-thinking, thudm/glm-4.1v-9b-thinking, thudm: glm 4.1v 9b thinking, openrouter/thudm/glm-4.1v-9b-thinking, glm-4.1v-9b-thinking, openrouter:mistralai/devstral-medium, mistralai/devstral-medium, mistral: devstral medium, openrouter/mistralai/devstral-medium, devstral-medium, openrouter:mistralai/devstral-small, mistralai/devstral-small, mistral: devstral small 1.1, openrouter/mistralai/devstral-small, devstral-small, openrouter:cognitivecomputations/dolphin-mistral-24b-venice-edition:free, cognitivecomputations/dolphin-mistral-24b-venice-edition:free, venice: uncensored (free), openrouter/cognitivecomputations/dolphin-mistral-24b-venice-edition:free, dolphin-mistral-24b-venice-edition:free, openrouter:x-ai/grok-4, x-ai/grok-4, xai: grok 4, openrouter/x-ai/grok-4, grok-4, openrouter:google/gemma-3n-e2b-it:free, google/gemma-3n-e2b-it:free, google: gemma 3n 2b (free), openrouter/google/gemma-3n-e2b-it:free, gemma-3n-e2b-it:free, openrouter:tencent/hunyuan-a13b-instruct, tencent/hunyuan-a13b-instruct, tencent: hunyuan a13b instruct, openrouter/tencent/hunyuan-a13b-instruct, hunyuan-a13b-instruct, openrouter:tngtech/deepseek-r1t2-chimera:free, tngtech/deepseek-r1t2-chimera:free, tng: deepseek r1t2 chimera (free), openrouter/tngtech/deepseek-r1t2-chimera:free, deepseek-r1t2-chimera:free, openrouter:tngtech/deepseek-r1t2-chimera, tngtech/deepseek-r1t2-chimera, tng: deepseek r1t2 chimera, openrouter/tngtech/deepseek-r1t2-chimera, deepseek-r1t2-chimera, openrouter:morph/morph-v3-large, morph/morph-v3-large, morph: morph v3 large, openrouter/morph/morph-v3-large, morph-v3-large, openrouter:morph/morph-v3-fast, morph/morph-v3-fast, morph: morph v3 fast, openrouter/morph/morph-v3-fast, morph-v3-fast, openrouter:baidu/ernie-4.5-vl-424b-a47b, baidu/ernie-4.5-vl-424b-a47b, baidu: ernie 4.5 vl 424b a47b, openrouter/baidu/ernie-4.5-vl-424b-a47b, ernie-4.5-vl-424b-a47b, openrouter:baidu/ernie-4.5-300b-a47b, baidu/ernie-4.5-300b-a47b, baidu: ernie 4.5 300b a47b, openrouter/baidu/ernie-4.5-300b-a47b, ernie-4.5-300b-a47b, openrouter:inception/mercury, inception/mercury, inception: mercury, openrouter/inception/mercury, mercury, openrouter:mistralai/mistral-small-3.2-24b-instruct, mistralai/mistral-small-3.2-24b-instruct, mistral: mistral small 3.2 24b, openrouter/mistralai/mistral-small-3.2-24b-instruct, mistral-small-3.2-24b-instruct, openrouter:minimax/minimax-m1, minimax/minimax-m1, minimax: minimax m1, openrouter/minimax/minimax-m1, minimax-m1, openrouter:google/gemini-2.5-flash, google/gemini-2.5-flash, google: gemini 2.5 flash, openrouter/google/gemini-2.5-flash, openrouter:google/gemini-2.5-pro, google/gemini-2.5-pro, google: gemini 2.5 pro, openrouter/google/gemini-2.5-pro, openrouter:moonshotai/kimi-dev-72b, moonshotai/kimi-dev-72b, moonshotai: kimi dev 72b, openrouter/moonshotai/kimi-dev-72b, kimi-dev-72b, openrouter:openai/o3-pro, openai/o3-pro, openai: o3 pro, openrouter/openai/o3-pro, o3-pro, openrouter:x-ai/grok-3-mini, x-ai/grok-3-mini, xai: grok 3 mini, openrouter/x-ai/grok-3-mini, openrouter:x-ai/grok-3, x-ai/grok-3, xai: grok 3, openrouter/x-ai/grok-3, openrouter:google/gemini-2.5-pro-preview, google/gemini-2.5-pro-preview, google: gemini 2.5 pro preview 06-05, openrouter/google/gemini-2.5-pro-preview, gemini-2.5-pro-preview, openrouter:deepseek/deepseek-r1-0528-qwen3-8b, deepseek/deepseek-r1-0528-qwen3-8b, deepseek: deepseek r1 0528 qwen3 8b, openrouter/deepseek/deepseek-r1-0528-qwen3-8b, deepseek-r1-0528-qwen3-8b, openrouter:deepseek/deepseek-r1-0528:free, deepseek/deepseek-r1-0528:free, deepseek: r1 0528 (free), openrouter/deepseek/deepseek-r1-0528:free, deepseek-r1-0528:free, openrouter:deepseek/deepseek-r1-0528, deepseek/deepseek-r1-0528, deepseek: r1 0528, openrouter/deepseek/deepseek-r1-0528, deepseek-r1-0528, openrouter:anthropic/claude-opus-4, anthropic/claude-opus-4, anthropic: claude opus 4, openrouter/anthropic/claude-opus-4, openrouter:anthropic/claude-sonnet-4, anthropic/claude-sonnet-4, anthropic: claude sonnet 4, openrouter/anthropic/claude-sonnet-4, openrouter:mistralai/devstral-small-2505, mistralai/devstral-small-2505, mistral: devstral small 2505, openrouter/mistralai/devstral-small-2505, devstral-small-2505, openrouter:google/gemma-3n-e4b-it:free, google/gemma-3n-e4b-it:free, google: gemma 3n 4b (free), openrouter/google/gemma-3n-e4b-it:free, gemma-3n-e4b-it:free, openrouter:google/gemma-3n-e4b-it, google: gemma 3n 4b, openrouter/google/gemma-3n-e4b-it, openrouter:openai/codex-mini, openai/codex-mini, openai: codex mini, openrouter/openai/codex-mini, codex-mini, openrouter:nousresearch/deephermes-3-mistral-24b-preview, nousresearch/deephermes-3-mistral-24b-preview, nous: deephermes 3 mistral 24b preview, openrouter/nousresearch/deephermes-3-mistral-24b-preview, deephermes-3-mistral-24b-preview, openrouter:mistralai/mistral-medium-3, mistralai/mistral-medium-3, mistral: mistral medium 3, openrouter/mistralai/mistral-medium-3, mistral-medium-3, openrouter:google/gemini-2.5-pro-preview-05-06, google/gemini-2.5-pro-preview-05-06, google: gemini 2.5 pro preview 05-06, openrouter/google/gemini-2.5-pro-preview-05-06, gemini-2.5-pro-preview-05-06, openrouter:arcee-ai/spotlight, arcee-ai/spotlight, arcee ai: spotlight, openrouter/arcee-ai/spotlight, spotlight, openrouter:arcee-ai/maestro-reasoning, arcee-ai/maestro-reasoning, arcee ai: maestro reasoning, openrouter/arcee-ai/maestro-reasoning, maestro-reasoning, openrouter:arcee-ai/virtuoso-large, arcee-ai/virtuoso-large, arcee ai: virtuoso large, openrouter/arcee-ai/virtuoso-large, virtuoso-large, openrouter:arcee-ai/coder-large, arcee-ai/coder-large, arcee ai: coder large, openrouter/arcee-ai/coder-large, coder-large, openrouter:microsoft/phi-4-reasoning-plus, microsoft/phi-4-reasoning-plus, microsoft: phi 4 reasoning plus, openrouter/microsoft/phi-4-reasoning-plus, phi-4-reasoning-plus, openrouter:inception/mercury-coder, inception/mercury-coder, inception: mercury coder, openrouter/inception/mercury-coder, mercury-coder, openrouter:qwen/qwen3-4b:free, qwen/qwen3-4b:free, qwen: qwen3 4b (free), openrouter/qwen/qwen3-4b:free, qwen3-4b:free, openrouter:deepseek/deepseek-prover-v2, deepseek/deepseek-prover-v2, deepseek: deepseek prover v2, openrouter/deepseek/deepseek-prover-v2, deepseek-prover-v2, openrouter:meta-llama/llama-guard-4-12b, meta: llama guard 4 12b, openrouter/meta-llama/llama-guard-4-12b, openrouter:qwen/qwen3-30b-a3b, qwen/qwen3-30b-a3b, qwen: qwen3 30b a3b, openrouter/qwen/qwen3-30b-a3b, qwen3-30b-a3b, openrouter:qwen/qwen3-8b, qwen/qwen3-8b, qwen: qwen3 8b, openrouter/qwen/qwen3-8b, qwen3-8b, openrouter:qwen/qwen3-14b, qwen/qwen3-14b, qwen: qwen3 14b, openrouter/qwen/qwen3-14b, qwen3-14b, openrouter:qwen/qwen3-32b, qwen/qwen3-32b, qwen: qwen3 32b, openrouter/qwen/qwen3-32b, qwen3-32b, openrouter:qwen/qwen3-235b-a22b:free, qwen/qwen3-235b-a22b:free, qwen: qwen3 235b a22b (free), openrouter/qwen/qwen3-235b-a22b:free, qwen3-235b-a22b:free, openrouter:qwen/qwen3-235b-a22b, qwen/qwen3-235b-a22b, qwen: qwen3 235b a22b, openrouter/qwen/qwen3-235b-a22b, qwen3-235b-a22b, openrouter:tngtech/deepseek-r1t-chimera:free, tngtech/deepseek-r1t-chimera:free, tng: deepseek r1t chimera (free), openrouter/tngtech/deepseek-r1t-chimera:free, deepseek-r1t-chimera:free, openrouter:tngtech/deepseek-r1t-chimera, tngtech/deepseek-r1t-chimera, tng: deepseek r1t chimera, openrouter/tngtech/deepseek-r1t-chimera, deepseek-r1t-chimera, openrouter:openai/o4-mini-high, openai/o4-mini-high, openai: o4 mini high, openrouter/openai/o4-mini-high, o4-mini-high, openrouter:openai/o3, openai/o3, openai: o3, openrouter/openai/o3, openrouter:openai/o4-mini, openai/o4-mini, openai: o4 mini, openrouter/openai/o4-mini, openrouter:qwen/qwen2.5-coder-7b-instruct, qwen/qwen2.5-coder-7b-instruct, qwen: qwen2.5 coder 7b instruct, openrouter/qwen/qwen2.5-coder-7b-instruct, qwen2.5-coder-7b-instruct, openrouter:openai/gpt-4.1, openai/gpt-4.1, openai: gpt-4.1, openrouter/openai/gpt-4.1, openrouter:openai/gpt-4.1-mini, openai/gpt-4.1-mini, openai: gpt-4.1 mini, openrouter/openai/gpt-4.1-mini, openrouter:openai/gpt-4.1-nano, openai/gpt-4.1-nano, openai: gpt-4.1 nano, openrouter/openai/gpt-4.1-nano, openrouter:eleutherai/llemma_7b, eleutherai/llemma_7b, eleutherai: llemma 7b, openrouter/eleutherai/llemma_7b, llemma_7b, openrouter:alfredpros/codellama-7b-instruct-solidity, alfredpros/codellama-7b-instruct-solidity, alfredpros: codellama 7b instruct solidity, openrouter/alfredpros/codellama-7b-instruct-solidity, codellama-7b-instruct-solidity, openrouter:arliai/qwq-32b-arliai-rpr-v1, arliai/qwq-32b-arliai-rpr-v1, arliai: qwq 32b rpr v1, openrouter/arliai/qwq-32b-arliai-rpr-v1, qwq-32b-arliai-rpr-v1, openrouter:x-ai/grok-3-mini-beta, x-ai/grok-3-mini-beta, xai: grok 3 mini beta, openrouter/x-ai/grok-3-mini-beta, grok-3-mini-beta, openrouter:x-ai/grok-3-beta, x-ai/grok-3-beta, xai: grok 3 beta, openrouter/x-ai/grok-3-beta, grok-3-beta, openrouter:nvidia/llama-3.1-nemotron-ultra-253b-v1, nvidia/llama-3.1-nemotron-ultra-253b-v1, nvidia: llama 3.1 nemotron ultra 253b v1, openrouter/nvidia/llama-3.1-nemotron-ultra-253b-v1, llama-3.1-nemotron-ultra-253b-v1, openrouter:meta-llama/llama-4-maverick, meta-llama/llama-4-maverick, meta: llama 4 maverick, openrouter/meta-llama/llama-4-maverick, llama-4-maverick, openrouter:meta-llama/llama-4-scout, meta-llama/llama-4-scout, meta: llama 4 scout, openrouter/meta-llama/llama-4-scout, llama-4-scout, openrouter:qwen/qwen2.5-vl-32b-instruct, qwen/qwen2.5-vl-32b-instruct, qwen: qwen2.5 vl 32b instruct, openrouter/qwen/qwen2.5-vl-32b-instruct, qwen2.5-vl-32b-instruct, openrouter:deepseek/deepseek-chat-v3-0324, deepseek/deepseek-chat-v3-0324, deepseek: deepseek v3 0324, openrouter/deepseek/deepseek-chat-v3-0324, deepseek-chat-v3-0324, openrouter:openai/o1-pro, openai/o1-pro, openai: o1-pro, openrouter/openai/o1-pro, openrouter:mistralai/mistral-small-3.1-24b-instruct:free, mistralai/mistral-small-3.1-24b-instruct:free, mistral: mistral small 3.1 24b (free), openrouter/mistralai/mistral-small-3.1-24b-instruct:free, mistral-small-3.1-24b-instruct:free, openrouter:mistralai/mistral-small-3.1-24b-instruct, mistralai/mistral-small-3.1-24b-instruct, mistral: mistral small 3.1 24b, openrouter/mistralai/mistral-small-3.1-24b-instruct, mistral-small-3.1-24b-instruct, openrouter:allenai/olmo-2-0325-32b-instruct, allenai/olmo-2-0325-32b-instruct, allenai: olmo 2 32b instruct, openrouter/allenai/olmo-2-0325-32b-instruct, olmo-2-0325-32b-instruct, openrouter:google/gemma-3-4b-it:free, google/gemma-3-4b-it:free, google: gemma 3 4b (free), openrouter/google/gemma-3-4b-it:free, gemma-3-4b-it:free, openrouter:google/gemma-3-4b-it, google/gemma-3-4b-it, google: gemma 3 4b, openrouter/google/gemma-3-4b-it, gemma-3-4b-it, openrouter:google/gemma-3-12b-it:free, google/gemma-3-12b-it:free, google: gemma 3 12b (free), openrouter/google/gemma-3-12b-it:free, gemma-3-12b-it:free, openrouter:google/gemma-3-12b-it, google/gemma-3-12b-it, google: gemma 3 12b, openrouter/google/gemma-3-12b-it, gemma-3-12b-it, openrouter:cohere/command-a, cohere/command-a, cohere: command a, openrouter/cohere/command-a, command-a, openrouter:openai/gpt-4o-mini-search-preview, openai/gpt-4o-mini-search-preview, openai: gpt-4o-mini search preview, openrouter/openai/gpt-4o-mini-search-preview, gpt-4o-mini-search-preview, openrouter:openai/gpt-4o-search-preview, openai/gpt-4o-search-preview, openai: gpt-4o search preview, openrouter/openai/gpt-4o-search-preview, gpt-4o-search-preview, openrouter:google/gemma-3-27b-it:free, google/gemma-3-27b-it:free, google: gemma 3 27b (free), openrouter/google/gemma-3-27b-it:free, gemma-3-27b-it:free, openrouter:google/gemma-3-27b-it, google/gemma-3-27b-it, google: gemma 3 27b, openrouter/google/gemma-3-27b-it, gemma-3-27b-it, openrouter:thedrummer/skyfall-36b-v2, thedrummer/skyfall-36b-v2, thedrummer: skyfall 36b v2, openrouter/thedrummer/skyfall-36b-v2, skyfall-36b-v2, openrouter:microsoft/phi-4-multimodal-instruct, microsoft/phi-4-multimodal-instruct, microsoft: phi 4 multimodal instruct, openrouter/microsoft/phi-4-multimodal-instruct, phi-4-multimodal-instruct, openrouter:perplexity/sonar-reasoning-pro, perplexity/sonar-reasoning-pro, perplexity: sonar reasoning pro, openrouter/perplexity/sonar-reasoning-pro, sonar-reasoning-pro, openrouter:perplexity/sonar-pro, perplexity/sonar-pro, perplexity: sonar pro, openrouter/perplexity/sonar-pro, sonar-pro, openrouter:perplexity/sonar-deep-research, perplexity/sonar-deep-research, perplexity: sonar deep research, openrouter/perplexity/sonar-deep-research, sonar-deep-research, openrouter:qwen/qwq-32b, qwen/qwq-32b, qwen: qwq 32b, openrouter/qwen/qwq-32b, qwq-32b, openrouter:google/gemini-2.0-flash-lite-001, google/gemini-2.0-flash-lite-001, google: gemini 2.0 flash lite, openrouter/google/gemini-2.0-flash-lite-001, gemini-2.0-flash-lite-001, openrouter:anthropic/claude-3.7-sonnet:thinking, anthropic/claude-3.7-sonnet:thinking, anthropic: claude 3.7 sonnet (thinking), openrouter/anthropic/claude-3.7-sonnet:thinking, claude-3.7-sonnet:thinking, openrouter:anthropic/claude-3.7-sonnet, anthropic/claude-3.7-sonnet, anthropic: claude 3.7 sonnet, openrouter/anthropic/claude-3.7-sonnet, claude-3.7-sonnet, openrouter:mistralai/mistral-saba, mistralai/mistral-saba, mistral: saba, openrouter/mistralai/mistral-saba, mistral-saba, openrouter:meta-llama/llama-guard-3-8b, meta-llama/llama-guard-3-8b, llama guard 3 8b, openrouter/meta-llama/llama-guard-3-8b, llama-guard-3-8b, openrouter:openai/o3-mini-high, openai/o3-mini-high, openai: o3 mini high, openrouter/openai/o3-mini-high, o3-mini-high, openrouter:google/gemini-2.0-flash-001, google/gemini-2.0-flash-001, google: gemini 2.0 flash, openrouter/google/gemini-2.0-flash-001, gemini-2.0-flash-001, openrouter:qwen/qwen-vl-plus, qwen/qwen-vl-plus, qwen: qwen vl plus, openrouter/qwen/qwen-vl-plus, qwen-vl-plus, openrouter:aion-labs/aion-1.0, aion-labs/aion-1.0, aionlabs: aion-1.0, openrouter/aion-labs/aion-1.0, aion-1.0, openrouter:aion-labs/aion-1.0-mini, aion-labs/aion-1.0-mini, aionlabs: aion-1.0-mini, openrouter/aion-labs/aion-1.0-mini, aion-1.0-mini, openrouter:aion-labs/aion-rp-llama-3.1-8b, aion-labs/aion-rp-llama-3.1-8b, aionlabs: aion-rp 1.0 (8b), openrouter/aion-labs/aion-rp-llama-3.1-8b, aion-rp-llama-3.1-8b, openrouter:qwen/qwen-vl-max, qwen/qwen-vl-max, qwen: qwen vl max, openrouter/qwen/qwen-vl-max, qwen-vl-max, openrouter:qwen/qwen-turbo, qwen/qwen-turbo, qwen: qwen-turbo, openrouter/qwen/qwen-turbo, qwen-turbo, openrouter:qwen/qwen2.5-vl-72b-instruct, qwen: qwen2.5 vl 72b instruct, openrouter/qwen/qwen2.5-vl-72b-instruct, openrouter:qwen/qwen-plus, qwen/qwen-plus, qwen: qwen-plus, openrouter/qwen/qwen-plus, qwen-plus, openrouter:qwen/qwen-max, qwen/qwen-max, qwen: qwen-max, openrouter/qwen/qwen-max, qwen-max, openrouter:openai/o3-mini, openai/o3-mini, openai: o3 mini, openrouter/openai/o3-mini, openrouter:mistralai/mistral-small-24b-instruct-2501, mistral: mistral small 3, openrouter/mistralai/mistral-small-24b-instruct-2501, openrouter:deepseek/deepseek-r1-distill-qwen-32b, deepseek/deepseek-r1-distill-qwen-32b, deepseek: r1 distill qwen 32b, openrouter/deepseek/deepseek-r1-distill-qwen-32b, deepseek-r1-distill-qwen-32b, openrouter:deepseek/deepseek-r1-distill-qwen-14b, deepseek/deepseek-r1-distill-qwen-14b, deepseek: r1 distill qwen 14b, openrouter/deepseek/deepseek-r1-distill-qwen-14b, deepseek-r1-distill-qwen-14b, openrouter:perplexity/sonar-reasoning, perplexity/sonar-reasoning, perplexity: sonar reasoning, openrouter/perplexity/sonar-reasoning, sonar-reasoning, openrouter:perplexity/sonar, perplexity/sonar, perplexity: sonar, openrouter/perplexity/sonar, sonar, openrouter:deepseek/deepseek-r1-distill-llama-70b, deepseek/deepseek-r1-distill-llama-70b, deepseek: r1 distill llama 70b, openrouter/deepseek/deepseek-r1-distill-llama-70b, openrouter:deepseek/deepseek-r1, deepseek/deepseek-r1, deepseek: r1, openrouter/deepseek/deepseek-r1, openrouter:minimax/minimax-01, minimax/minimax-01, minimax: minimax-01, openrouter/minimax/minimax-01, minimax-01, openrouter:microsoft/phi-4, microsoft/phi-4, microsoft: phi 4, openrouter/microsoft/phi-4, phi-4, openrouter:sao10k/l3.1-70b-hanami-x1, sao10k/l3.1-70b-hanami-x1, sao10k: llama 3.1 70b hanami x1, openrouter/sao10k/l3.1-70b-hanami-x1, l3.1-70b-hanami-x1, openrouter:deepseek/deepseek-chat, deepseek/deepseek-chat, deepseek: deepseek v3, openrouter/deepseek/deepseek-chat, openrouter:sao10k/l3.3-euryale-70b, sao10k/l3.3-euryale-70b, sao10k: llama 3.3 euryale 70b, openrouter/sao10k/l3.3-euryale-70b, l3.3-euryale-70b, openrouter:openai/o1, openai/o1, openai: o1, openrouter/openai/o1, openrouter:cohere/command-r7b-12-2024, cohere/command-r7b-12-2024, cohere: command r7b (12-2024), openrouter/cohere/command-r7b-12-2024, command-r7b-12-2024, openrouter:google/gemini-2.0-flash-exp:free, google/gemini-2.0-flash-exp:free, google: gemini 2.0 flash experimental (free), openrouter/google/gemini-2.0-flash-exp:free, gemini-2.0-flash-exp:free, openrouter:meta-llama/llama-3.3-70b-instruct:free, meta-llama/llama-3.3-70b-instruct:free, meta: llama 3.3 70b instruct (free), openrouter/meta-llama/llama-3.3-70b-instruct:free, llama-3.3-70b-instruct:free, openrouter:meta-llama/llama-3.3-70b-instruct, meta-llama/llama-3.3-70b-instruct, meta: llama 3.3 70b instruct, openrouter/meta-llama/llama-3.3-70b-instruct, llama-3.3-70b-instruct, openrouter:amazon/nova-lite-v1, amazon/nova-lite-v1, amazon: nova lite 1.0, openrouter/amazon/nova-lite-v1, nova-lite-v1, openrouter:amazon/nova-micro-v1, amazon/nova-micro-v1, amazon: nova micro 1.0, openrouter/amazon/nova-micro-v1, nova-micro-v1, openrouter:amazon/nova-pro-v1, amazon/nova-pro-v1, amazon: nova pro 1.0, openrouter/amazon/nova-pro-v1, nova-pro-v1, openrouter:openai/gpt-4o-2024-11-20, openai/gpt-4o-2024-11-20, openai: gpt-4o (2024-11-20), openrouter/openai/gpt-4o-2024-11-20, gpt-4o-2024-11-20, openrouter:mistralai/mistral-large-2411, mistralai/mistral-large-2411, mistral large 2411, openrouter/mistralai/mistral-large-2411, mistral-large-2411, openrouter:mistralai/mistral-large-2407, mistralai/mistral-large-2407, mistral large 2407, openrouter/mistralai/mistral-large-2407, mistral-large-2407, openrouter:mistralai/pixtral-large-2411, mistralai/pixtral-large-2411, mistral: pixtral large 2411, openrouter/mistralai/pixtral-large-2411, openrouter:qwen/qwen-2.5-coder-32b-instruct, qwen/qwen-2.5-coder-32b-instruct, qwen2.5 coder 32b instruct, openrouter/qwen/qwen-2.5-coder-32b-instruct, qwen-2.5-coder-32b-instruct, openrouter:raifle/sorcererlm-8x22b, raifle/sorcererlm-8x22b, sorcererlm 8x22b, openrouter/raifle/sorcererlm-8x22b, sorcererlm-8x22b, openrouter:thedrummer/unslopnemo-12b, thedrummer/unslopnemo-12b, thedrummer: unslopnemo 12b, openrouter/thedrummer/unslopnemo-12b, unslopnemo-12b, openrouter:anthropic/claude-3.5-haiku, anthropic/claude-3.5-haiku, anthropic: claude 3.5 haiku, openrouter/anthropic/claude-3.5-haiku, claude-3.5-haiku, openrouter:anthropic/claude-3.5-haiku-20241022, anthropic/claude-3.5-haiku-20241022, anthropic: claude 3.5 haiku (2024-10-22), openrouter/anthropic/claude-3.5-haiku-20241022, claude-3.5-haiku-20241022, openrouter:anthropic/claude-3.5-sonnet, anthropic/claude-3.5-sonnet, anthropic: claude 3.5 sonnet, openrouter/anthropic/claude-3.5-sonnet, claude-3.5-sonnet, openrouter:anthracite-org/magnum-v4-72b, anthracite-org/magnum-v4-72b, magnum v4 72b, openrouter/anthracite-org/magnum-v4-72b, magnum-v4-72b, openrouter:mistralai/ministral-8b, mistralai/ministral-8b, mistral: ministral 8b, openrouter/mistralai/ministral-8b, ministral-8b, openrouter:mistralai/ministral-3b, mistralai/ministral-3b, mistral: ministral 3b, openrouter/mistralai/ministral-3b, ministral-3b, openrouter:qwen/qwen-2.5-7b-instruct, qwen/qwen-2.5-7b-instruct, qwen: qwen2.5 7b instruct, openrouter/qwen/qwen-2.5-7b-instruct, qwen-2.5-7b-instruct, openrouter:nvidia/llama-3.1-nemotron-70b-instruct, nvidia/llama-3.1-nemotron-70b-instruct, nvidia: llama 3.1 nemotron 70b instruct, openrouter/nvidia/llama-3.1-nemotron-70b-instruct, llama-3.1-nemotron-70b-instruct, openrouter:inflection/inflection-3-pi, inflection/inflection-3-pi, inflection: inflection 3 pi, openrouter/inflection/inflection-3-pi, inflection-3-pi, openrouter:inflection/inflection-3-productivity, inflection/inflection-3-productivity, inflection: inflection 3 productivity, openrouter/inflection/inflection-3-productivity, inflection-3-productivity, openrouter:thedrummer/rocinante-12b, thedrummer/rocinante-12b, thedrummer: rocinante 12b, openrouter/thedrummer/rocinante-12b, rocinante-12b, openrouter:meta-llama/llama-3.2-90b-vision-instruct, meta-llama/llama-3.2-90b-vision-instruct, meta: llama 3.2 90b vision instruct, openrouter/meta-llama/llama-3.2-90b-vision-instruct, llama-3.2-90b-vision-instruct, openrouter:meta-llama/llama-3.2-11b-vision-instruct, meta-llama/llama-3.2-11b-vision-instruct, meta: llama 3.2 11b vision instruct, openrouter/meta-llama/llama-3.2-11b-vision-instruct, llama-3.2-11b-vision-instruct, openrouter:meta-llama/llama-3.2-1b-instruct, meta: llama 3.2 1b instruct, openrouter/meta-llama/llama-3.2-1b-instruct, openrouter:meta-llama/llama-3.2-3b-instruct:free, meta-llama/llama-3.2-3b-instruct:free, meta: llama 3.2 3b instruct (free), openrouter/meta-llama/llama-3.2-3b-instruct:free, llama-3.2-3b-instruct:free, openrouter:meta-llama/llama-3.2-3b-instruct, meta-llama/llama-3.2-3b-instruct, meta: llama 3.2 3b instruct, openrouter/meta-llama/llama-3.2-3b-instruct, llama-3.2-3b-instruct, openrouter:qwen/qwen-2.5-72b-instruct, qwen/qwen-2.5-72b-instruct, qwen2.5 72b instruct, openrouter/qwen/qwen-2.5-72b-instruct, qwen-2.5-72b-instruct, openrouter:neversleep/llama-3.1-lumimaid-8b, neversleep/llama-3.1-lumimaid-8b, neversleep: lumimaid v0.2 8b, openrouter/neversleep/llama-3.1-lumimaid-8b, llama-3.1-lumimaid-8b, openrouter:mistralai/pixtral-12b, mistralai/pixtral-12b, mistral: pixtral 12b, openrouter/mistralai/pixtral-12b, pixtral-12b, openrouter:cohere/command-r-08-2024, cohere/command-r-08-2024, cohere: command r (08-2024), openrouter/cohere/command-r-08-2024, command-r-08-2024, openrouter:cohere/command-r-plus-08-2024, cohere/command-r-plus-08-2024, cohere: command r+ (08-2024), openrouter/cohere/command-r-plus-08-2024, command-r-plus-08-2024, openrouter:qwen/qwen-2.5-vl-7b-instruct:free, qwen/qwen-2.5-vl-7b-instruct:free, qwen: qwen2.5-vl 7b instruct (free), openrouter/qwen/qwen-2.5-vl-7b-instruct:free, qwen-2.5-vl-7b-instruct:free, openrouter:qwen/qwen-2.5-vl-7b-instruct, qwen/qwen-2.5-vl-7b-instruct, qwen: qwen2.5-vl 7b instruct, openrouter/qwen/qwen-2.5-vl-7b-instruct, qwen-2.5-vl-7b-instruct, openrouter:sao10k/l3.1-euryale-70b, sao10k/l3.1-euryale-70b, sao10k: llama 3.1 euryale 70b v2.2, openrouter/sao10k/l3.1-euryale-70b, l3.1-euryale-70b, openrouter:microsoft/phi-3.5-mini-128k-instruct, microsoft/phi-3.5-mini-128k-instruct, microsoft: phi-3.5 mini 128k instruct, openrouter/microsoft/phi-3.5-mini-128k-instruct, phi-3.5-mini-128k-instruct, openrouter:nousresearch/hermes-3-llama-3.1-70b, nousresearch/hermes-3-llama-3.1-70b, nous: hermes 3 70b instruct, openrouter/nousresearch/hermes-3-llama-3.1-70b, hermes-3-llama-3.1-70b, openrouter:nousresearch/hermes-3-llama-3.1-405b:free, nousresearch/hermes-3-llama-3.1-405b:free, nous: hermes 3 405b instruct (free), openrouter/nousresearch/hermes-3-llama-3.1-405b:free, hermes-3-llama-3.1-405b:free, openrouter:nousresearch/hermes-3-llama-3.1-405b, nousresearch/hermes-3-llama-3.1-405b, nous: hermes 3 405b instruct, openrouter/nousresearch/hermes-3-llama-3.1-405b, hermes-3-llama-3.1-405b, openrouter:openai/chatgpt-4o-latest, openai/chatgpt-4o-latest, openai: chatgpt-4o, openrouter/openai/chatgpt-4o-latest, chatgpt-4o-latest, openrouter:sao10k/l3-lunaris-8b, sao10k/l3-lunaris-8b, sao10k: llama 3 8b lunaris, openrouter/sao10k/l3-lunaris-8b, l3-lunaris-8b, openrouter:openai/gpt-4o-2024-08-06, openai/gpt-4o-2024-08-06, openai: gpt-4o (2024-08-06), openrouter/openai/gpt-4o-2024-08-06, gpt-4o-2024-08-06, openrouter:meta-llama/llama-3.1-405b, meta-llama/llama-3.1-405b, meta: llama 3.1 405b (base), openrouter/meta-llama/llama-3.1-405b, llama-3.1-405b, openrouter:meta-llama/llama-3.1-405b-instruct:free, meta-llama/llama-3.1-405b-instruct:free, meta: llama 3.1 405b instruct (free), openrouter/meta-llama/llama-3.1-405b-instruct:free, llama-3.1-405b-instruct:free, openrouter:meta-llama/llama-3.1-405b-instruct, meta: llama 3.1 405b instruct, openrouter/meta-llama/llama-3.1-405b-instruct, openrouter:meta-llama/llama-3.1-8b-instruct, meta-llama/llama-3.1-8b-instruct, meta: llama 3.1 8b instruct, openrouter/meta-llama/llama-3.1-8b-instruct, llama-3.1-8b-instruct, openrouter:meta-llama/llama-3.1-70b-instruct, meta-llama/llama-3.1-70b-instruct, meta: llama 3.1 70b instruct, openrouter/meta-llama/llama-3.1-70b-instruct, llama-3.1-70b-instruct, openrouter:mistralai/mistral-nemo, mistralai/mistral-nemo, mistral: mistral nemo, openrouter/mistralai/mistral-nemo, mistral-nemo, openrouter:openai/gpt-4o-mini-2024-07-18, openai/gpt-4o-mini-2024-07-18, openai: gpt-4o-mini (2024-07-18), openrouter/openai/gpt-4o-mini-2024-07-18, gpt-4o-mini-2024-07-18, openrouter:openai/gpt-4o-mini, openai/gpt-4o-mini, openai: gpt-4o-mini, openrouter/openai/gpt-4o-mini, openrouter:google/gemma-2-27b-it, google/gemma-2-27b-it, google: gemma 2 27b, openrouter/google/gemma-2-27b-it, gemma-2-27b-it, openrouter:google/gemma-2-9b-it, google/gemma-2-9b-it, google: gemma 2 9b, openrouter/google/gemma-2-9b-it, gemma-2-9b-it, openrouter:sao10k/l3-euryale-70b, sao10k/l3-euryale-70b, sao10k: llama 3 euryale 70b v2.1, openrouter/sao10k/l3-euryale-70b, l3-euryale-70b, openrouter:mistralai/mistral-7b-instruct:free, mistralai/mistral-7b-instruct:free, mistral: mistral 7b instruct (free), openrouter/mistralai/mistral-7b-instruct:free, mistral-7b-instruct:free, openrouter:mistralai/mistral-7b-instruct, mistralai/mistral-7b-instruct, mistral: mistral 7b instruct, openrouter/mistralai/mistral-7b-instruct, mistral-7b-instruct, openrouter:nousresearch/hermes-2-pro-llama-3-8b, nousresearch/hermes-2-pro-llama-3-8b, nousresearch: hermes 2 pro - llama-3 8b, openrouter/nousresearch/hermes-2-pro-llama-3-8b, hermes-2-pro-llama-3-8b, openrouter:mistralai/mistral-7b-instruct-v0.3, mistral: mistral 7b instruct v0.3, openrouter/mistralai/mistral-7b-instruct-v0.3, openrouter:microsoft/phi-3-mini-128k-instruct, microsoft/phi-3-mini-128k-instruct, microsoft: phi-3 mini 128k instruct, openrouter/microsoft/phi-3-mini-128k-instruct, phi-3-mini-128k-instruct, openrouter:microsoft/phi-3-medium-128k-instruct, microsoft/phi-3-medium-128k-instruct, microsoft: phi-3 medium 128k instruct, openrouter/microsoft/phi-3-medium-128k-instruct, phi-3-medium-128k-instruct, openrouter:meta-llama/llama-guard-2-8b, meta-llama/llama-guard-2-8b, meta: llamaguard 2 8b, openrouter/meta-llama/llama-guard-2-8b, llama-guard-2-8b, openrouter:openai/gpt-4o-2024-05-13, openai/gpt-4o-2024-05-13, openai: gpt-4o (2024-05-13), openrouter/openai/gpt-4o-2024-05-13, gpt-4o-2024-05-13, openrouter:openai/gpt-4o, openai/gpt-4o, openai: gpt-4o, openrouter/openai/gpt-4o, openrouter:openai/gpt-4o:extended, openai/gpt-4o:extended, openai: gpt-4o (extended), openrouter/openai/gpt-4o:extended, gpt-4o:extended, openrouter:meta-llama/llama-3-70b-instruct, meta-llama/llama-3-70b-instruct, meta: llama 3 70b instruct, openrouter/meta-llama/llama-3-70b-instruct, llama-3-70b-instruct, openrouter:meta-llama/llama-3-8b-instruct, meta-llama/llama-3-8b-instruct, meta: llama 3 8b instruct, openrouter/meta-llama/llama-3-8b-instruct, llama-3-8b-instruct, openrouter:mistralai/mixtral-8x22b-instruct, mistralai/mixtral-8x22b-instruct, mistral: mixtral 8x22b instruct, openrouter/mistralai/mixtral-8x22b-instruct, mixtral-8x22b-instruct, openrouter:microsoft/wizardlm-2-8x22b, microsoft/wizardlm-2-8x22b, wizardlm-2 8x22b, openrouter/microsoft/wizardlm-2-8x22b, wizardlm-2-8x22b, openrouter:openai/gpt-4-turbo, openai/gpt-4-turbo, openai: gpt-4 turbo, openrouter/openai/gpt-4-turbo, gpt-4-turbo, openrouter:anthropic/claude-3-haiku, anthropic/claude-3-haiku, anthropic: claude 3 haiku, openrouter/anthropic/claude-3-haiku, claude-3-haiku, openrouter:anthropic/claude-3-opus, anthropic/claude-3-opus, anthropic: claude 3 opus, openrouter/anthropic/claude-3-opus, claude-3-opus, openrouter:mistralai/mistral-large, mistralai/mistral-large, mistral large, openrouter/mistralai/mistral-large, mistral-large, openrouter:openai/gpt-3.5-turbo-0613, openai/gpt-3.5-turbo-0613, openai: gpt-3.5 turbo (older v0613), openrouter/openai/gpt-3.5-turbo-0613, gpt-3.5-turbo-0613, openrouter:openai/gpt-4-turbo-preview, openai/gpt-4-turbo-preview, openai: gpt-4 turbo preview, openrouter/openai/gpt-4-turbo-preview, gpt-4-turbo-preview, openrouter:mistralai/mistral-tiny, mistralai/mistral-tiny, mistral tiny, openrouter/mistralai/mistral-tiny, openrouter:mistralai/mistral-7b-instruct-v0.2, mistral: mistral 7b instruct v0.2, openrouter/mistralai/mistral-7b-instruct-v0.2, openrouter:mistralai/mixtral-8x7b-instruct, mistralai/mixtral-8x7b-instruct, mistral: mixtral 8x7b instruct, openrouter/mistralai/mixtral-8x7b-instruct, mixtral-8x7b-instruct, openrouter:neversleep/noromaid-20b, neversleep/noromaid-20b, noromaid 20b, openrouter/neversleep/noromaid-20b, noromaid-20b, openrouter:alpindale/goliath-120b, alpindale/goliath-120b, goliath 120b, openrouter/alpindale/goliath-120b, goliath-120b, openrouter:openrouter/auto, openrouter/auto, auto router, openrouter/openrouter/auto, auto, openrouter:openai/gpt-4-1106-preview, openai/gpt-4-1106-preview, openai: gpt-4 turbo (older v1106), openrouter/openai/gpt-4-1106-preview, gpt-4-1106-preview, openrouter:openai/gpt-3.5-turbo-instruct, openai/gpt-3.5-turbo-instruct, openai: gpt-3.5 turbo instruct, openrouter/openai/gpt-3.5-turbo-instruct, gpt-3.5-turbo-instruct, openrouter:mistralai/mistral-7b-instruct-v0.1, mistralai/mistral-7b-instruct-v0.1, mistral: mistral 7b instruct v0.1, openrouter/mistralai/mistral-7b-instruct-v0.1, mistral-7b-instruct-v0.1, openrouter:openai/gpt-3.5-turbo-16k, openai/gpt-3.5-turbo-16k, openai: gpt-3.5 turbo 16k, openrouter/openai/gpt-3.5-turbo-16k, gpt-3.5-turbo-16k, openrouter:mancer/weaver, mancer/weaver, mancer: weaver (alpha), openrouter/mancer/weaver, weaver, openrouter:undi95/remm-slerp-l2-13b, undi95/remm-slerp-l2-13b, remm slerp 13b, openrouter/undi95/remm-slerp-l2-13b, remm-slerp-l2-13b, openrouter:gryphe/mythomax-l2-13b, gryphe/mythomax-l2-13b, mythomax 13b, openrouter/gryphe/mythomax-l2-13b, mythomax-l2-13b, openrouter:openai/gpt-4-0314, openai/gpt-4-0314, openai: gpt-4 (older v0314), openrouter/openai/gpt-4-0314, gpt-4-0314, openrouter:openai/gpt-4, openai/gpt-4, openai: gpt-4, openrouter/openai/gpt-4, gpt-4"
  */


  const img2txt = async (image: string | File | Blob, testMode?: boolean) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.ai.img2txt(image, testMode);
  };

  const getKV = async (key: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.kv.get(key);
  };

  const setKV = async (key: string, value: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.kv.set(key, value);
  };

  const deleteKV = async (key: string) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.kv.delete(key);
  };

  const listKV = async (pattern: string, returnValues?: boolean) => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    if (returnValues === undefined) {
      returnValues = false;
    }
    return puter.kv.list(pattern, returnValues);
  };

  const flushKV = async () => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js no disponible");
      return;
    }
    return puter.kv.flush();
  };

  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user,
    },
    fs: {
      write: (path: string, data: string | File | Blob) => write(path, data),
      read: (path: string) => readFile(path),
      readDir: (path: string) => readDir(path),
      upload: (files: File[] | Blob[]) => upload(files),
      delete: (path: string) => deleteFile(path),
    },
    ai: {
      chat: (
        prompt: string | ChatMessage[],
        imageURL?: string | PuterChatOptions,
        testMode?: boolean,
        options?: PuterChatOptions
      ) => chat(prompt, imageURL, testMode, options),
      feedback: (path: string, message: string) => feedback(path, message),
      img2txt: (image: string | File | Blob, testMode?: boolean) =>
        img2txt(image, testMode),
    },
    kv: {
      get: (key: string) => getKV(key),
      set: (key: string, value: string) => setKV(key, value),
      delete: (key: string) => deleteKV(key),
      list: (pattern: string, returnValues?: boolean) =>
        listKV(pattern, returnValues),
      flush: () => flushKV(),
    },
    init,
    clearError: () => set({ error: null }),
  };
});