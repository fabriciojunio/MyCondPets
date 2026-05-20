import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginComponent from "./LoginComponent";
import { signIn } from "next-auth/react";

// Mock do next-auth/react
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
}));

describe("LoginComponent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renderiza o botão com o texto correto", () => {
    render(<LoginComponent />);
    const button = screen.getByRole("button", { name: /entrar com google/i });
    expect(button).toBeInTheDocument();
  });

  test("chama a função signIn com 'google' ao clicar no botão", () => {
    render(<LoginComponent />);
    const button = screen.getByRole("button", { name: /entrar com google/i });
    
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith("google");
  });
});