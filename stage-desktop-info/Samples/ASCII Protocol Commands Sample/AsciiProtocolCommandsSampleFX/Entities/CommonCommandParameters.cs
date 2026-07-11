//-----------------------------------------------------------------------
// <copyright file="CommonCommandParameters.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Provides properties common parameters
    /// </summary>
    public interface ICommonCommandParameters
    {
        /// <summary>
        /// Gets the antenna parameters
        /// </summary>
        IObservableAntennaParameters Antenna { get; }

        /// <summary>
        /// Gets the lock parameters
        /// </summary>
        IObservableLockParameters Lock { get; }

        /// <summary>
        /// Gets the query parameters
        /// </summary>
        IObservableQueryParameters Query { get; }

        /// <summary>
        /// Gets the response parameters
        /// </summary>
        IObservableResponseParameters Response { get; }

        /// <summary>
        /// Gets the select parameters
        /// </summary>
        IObservableSelectParameters Select { get; }

        /// <summary>
        /// Gets the transponder parameters
        /// </summary>
        IObservableTransponderParameters Transponder { get; }
    }

    /// <summary>
    /// Container for the command parameters that are used across a number of commands
    /// </summary>
    public class CommonCommandParameters
        : ICommonCommandParameters
    {
        /// <summary>
        /// Initializes a new instance of the CommonCommandParameters class
        /// </summary>
        public CommonCommandParameters()
        {
            this.Antenna = new AntennaParametersAdapter();
            this.Lock = new LockParameters();
            this.Query = new QueryParameters();
            this.Response = new ResponseParametersAdapter();
            this.Select = new SelectParameters();
            this.Transponder = new TransponderParametersAdapter();
        }

        /// <summary>
        /// Gets or sets the antenna parameters
        /// </summary>
        public IObservableAntennaParameters Antenna { get; set; }

        /// <summary>
        /// Gets or sets the lock parameters
        /// </summary>
        public IObservableLockParameters Lock { get; set; }

        /// <summary>
        /// Gets or sets the query parameters
        /// </summary>
        public IObservableQueryParameters Query { get; set; }

        /// <summary>
        /// Gets or sets the response parameters
        /// </summary>
        public IObservableResponseParameters Response { get; set; }

        /// <summary>
        /// Gets or sets the select parameters
        /// </summary>
        public IObservableSelectParameters Select { get; set; }

        /// <summary>
        /// Gets or sets the transponder parameters
        /// </summary>
        public IObservableTransponderParameters Transponder { get; set; }
    }
}
