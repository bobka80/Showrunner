//-----------------------------------------------------------------------
// <copyright file="ParametersExtensions.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Extension methods for the parameter classes
    /// </summary>
    public static class ParametersExtensions
    {
        /// <summary>
        /// Copy the <see cref="IAntennaParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplyAntennaParameters(this IAntennaParameters destination, IAntennaParameters source)
        {
            destination.OutputPower = source.OutputPower;
        }

        /// <summary>
        /// Copy the <see cref="IQueryParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplyQueryParameters(this IQueryParameters destination, IQueryParameters source)
        {
            destination.QuerySelect = source.QuerySelect;
            destination.QuerySession = source.QuerySession;
            destination.QueryTarget = source.QueryTarget;
        }

        /// <summary>
        /// Copy the <see cref="IResponseParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplyResponseParameters(this IResponseParameters destination, IResponseParameters source)
        {
            destination.IncludeDateTime = source.IncludeDateTime;
            destination.UseAlert = source.UseAlert;
        }

        /// <summary>
        /// Copy the <see cref="ISelectParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplySelectParameters(this ISelectParameters destination, ISelectParameters source)
        {
            destination.InventoryOnly = source.InventoryOnly;
            destination.SelectAction = source.SelectAction;
            destination.SelectBank = source.SelectBank;
            destination.SelectData = source.SelectData;
            destination.SelectLength = source.SelectLength;
            destination.SelectOffset = source.SelectOffset;
            destination.SelectTarget = source.SelectTarget;
        }

        /// <summary>
        /// Copy the <see cref="ITransponderParameters"/> from the source to the destination
        /// </summary>        
        /// <param name="destination">The destination to copy to</param>
        /// <param name="source">The source to copy from</param>
        public static void ApplyTransponderParameters(this ITransponderParameters destination, ITransponderParameters source)
        {
            destination.IncludeChecksum = source.IncludeChecksum;
            try
            {
                destination.IncludeIndex = source.IncludeIndex;
            }
            catch (NotSupportedException)
            {
                // write single transponder does not support this
            }

            destination.IncludePC = source.IncludePC;
            destination.IncludeTransponderRssi = source.IncludeTransponderRssi;
        }        

        /// <summary>
        /// Converts the int? setting to a string for persitsence in the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static string ToSetting(this int? value)
        {
            if (value.HasValue)
            {
                return value.ToString();
            }
            else
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Converts the TriState? setting to a string for persitsence in the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static string ToSetting(this TriState? value)
        {
            if (value.HasValue)
            {
                return value.Parameter();
            }
            else
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Converts the string setting to a int? rehydrated from the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static int? ToInt(this string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }
            else
            {
                return int.Parse(value);
            }
        }

        /// <summary>
        /// Converts the string setting to a TriState? rehydrated from the settings
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static TriState? ToTriState(this string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return null;
            }
            else
            {
                return value.ParseParameterAs<TriState>();
            }
        }

        /// <summary>
        /// Converts the bool? to a TriState?
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static TriState? ToNullableTriState(this bool? value)
        {
            if (value.HasValue)
            {
                return value.Value ? TriState.Yes : TriState.No;
            }

            return null;
        }

        /// <summary>
        /// Converts the TriState? to a bool?
        /// </summary>
        /// <param name="value">The value to convert</param>
        /// <returns>The converted value</returns>
        public static bool? ToNullableBool(this TriState? value)
        {
            if (value.HasValue)
            {
                return value.Value == TriState.Yes;
            }

            return null;
        }
    }
}
