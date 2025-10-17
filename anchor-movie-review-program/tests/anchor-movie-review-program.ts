import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { AnchorMovieReviewProgram } from "../target/types/anchor_movie_review_program";

describe("anchor-movie-review-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .AnchorMovieReviewProgram as Program<AnchorMovieReviewProgram>;

  const movie = {
    title: "Just a test movie",
    description: "Wow what a good movie it was real great",
    rating: 5,
  };

  const [moviePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(movie.title), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    program.programId
  );

  it("Initializes the reward token", async () => {
    const tx = await program.methods
      .initializeTokenMint()
      .accounts({
        mint,
        user: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
  });

  it("Movie review is added", async () => {
    const tokenAccount = await getAssociatedTokenAddress(
      mint,
      provider.wallet.publicKey
    );

    const tx = await program.methods
      .addMovieReview(movie.title, movie.description, movie.rating)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        mint,
        tokenAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      })
      .rpc();

    const account = await program.account.movieAccountState.fetch(moviePda);
    expect(account.title).to.equal(movie.title);
    expect(account.rating).to.equal(movie.rating);
    expect(account.description).to.equal(movie.description);
    expect(account.reviewer.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );

    const userAta = await getAccount(provider.connection, tokenAccount);
    expect(Number(userAta.amount)).to.equal(10 * Math.pow(10, 6));
  });

  it("Movie review is updated`", async () => {
    const newDescription = "Wow this is new";
    const newRating = 4;

    const tx = await program.methods
      .updateMovieReview(movie.title, newDescription, newRating)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const account = await program.account.movieAccountState.fetch(moviePda);
    expect(account.title).to.equal(movie.title);
    expect(account.rating).to.equal(newRating);
    expect(account.description).to.equal(newDescription);
    expect(account.reviewer.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );
  });

  it("Deletes a movie review", async () => {
    const tx = await program.methods
      .deleteMovieReview(movie.title)
      .accounts({
        movieReview: moviePda,
        initializer: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();
  });
});
