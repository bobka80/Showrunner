//-----------------------------------------------------------------------
// <copyright file="ILockParameters.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;

    using TechnologySolutions.Rfid.AsciiProtocol;

    /// <summary>
    /// Provides properties to manipulate the <see cref="LockPayload"/> of a <see cref="LockCommand"/>
    /// </summary>
    public interface ILockParameters
    {
        /// <summary>
        /// Gets or sets the payload as used by the lock command
        /// </summary>
        int Payload { get; set; }
    }
}
