//-----------------------------------------------------------------------
// <copyright file="ICommandService.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides an interface to execute reader commands
    /// </summary>
    public interface ICommandService
    {
        /// <summary>
        /// Raised when either the <see cref="IsConnected"/> or <see cref="IsInCommand"/> properties change
        /// </summary>
        event EventHandler StateChanged;

        /// <summary>
        /// Gets a value indicating whether a reader is connected
        /// </summary>
        bool IsConnected { get; }

        /// <summary>
        /// Gets a value indicating whether the reader is currently executing a synchronous command
        /// </summary>
        bool IsInCommand { get; }

        /// <summary>
        /// Execute the command specified
        /// </summary>
        /// <param name="command">The command to execute</param>
        /// <param name="isCommandSynchronous">
        /// True to execute the command synchronously.
        /// False to execute the command asynchronously.
        /// </param>
        /// <remarks>
        /// Synchronous commands block until complete and the command response is updated with the response to the command 
        /// via the synchronous responder in the responder chain.
        /// Asynchonous commands return once the command is sent and the response is (hopefully) handled by other responders in the responder chain
        /// </remarks>
        void Execute(IAsciiCommand command, bool isCommandSynchronous);
    }
}
